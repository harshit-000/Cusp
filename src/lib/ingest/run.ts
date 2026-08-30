import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb, type Db } from "@/db";
import {
  companies as companiesT,
  jobs as jobsT,
  matches as matchesT,
  tasks as tasksT,
} from "@/db/schema";
import { loadConfig, type AppConfig } from "@/config/load";
import type { CompanyConfig } from "@/config/schema";
import type { EvaluatedJob } from "@/lib/types";
import { getConnector, companyId } from "@/lib/connectors";
import { evaluateBoard } from "@/lib/engine/pipeline";
import { claimTask, completeTask, failTask } from "@/lib/queue/queue";
import { sweepGhosted } from "@/lib/data/ghost";
import { getFetchingEnabled } from "@/lib/data/settings";
import { discoverEvaluated, adzunaEnabled } from "@/lib/discovery";
import { SELF_USER_ID } from "@/lib/constants";

export interface IngestStats {
  companies: number;
  processed: number;
  failed: number;
  jobsUpserted: number;
  discovered: number; // jobs from Adzuna broad discovery
  skipped: boolean; // true when fetching is turned off
}

/**
 * Full ingest cycle: sync companies from config → enqueue a refresh task per
 * board → drain the queue within a time budget, fetching/scoring/upserting jobs.
 * Time-boxed so it fits a serverless invocation; unfinished tasks resume next run.
 */
export async function runIngest(
  opts: { timeBudgetMs?: number; force?: boolean } = {},
): Promise<IngestStats> {
  const timeBudgetMs = opts.timeBudgetMs ?? 55_000;
  const startedAt = Date.now();
  const cfg = loadConfig();
  const db = getDb();

  // Respect the fetching toggle (cron obeys it; `force` — manual runs — overrides).
  if (!opts.force && !(await getFetchingEnabled())) {
    return { companies: cfg.companies.length, processed: 0, failed: 0, jobsUpserted: 0, discovered: 0, skipped: true };
  }

  await upsertCompanies(db, cfg);
  await enqueueRefreshTasks(db, cfg);

  const byId = new Map(cfg.companies.map((c) => [companyId(c.ats, c.token), c]));
  let processed = 0;
  let failed = 0;
  let jobsUpserted = 0;

  while (Date.now() - startedAt < timeBudgetMs) {
    const task = await claimTask(db);
    if (!task) break;

    const company = byId.get(task.companyId);
    if (!company) {
      await completeTask(db, task.id); // company removed from config — retire task
      continue;
    }

    try {
      jobsUpserted += await processBoard(db, cfg, company, task.id, task.etag);
      processed++;
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      await failTask(db, task.id, task.attempts, msg);
    }
  }

  // Broad, query-driven discovery (Adzuna) — market-wide, beyond the source list.
  const discovered = await runDiscovery(db, cfg);

  // Age-off applications that have gone silent.
  await sweepGhosted(db);

  return { companies: cfg.companies.length, processed, failed, jobsUpserted, discovered, skipped: false };
}

async function runDiscovery(db: Db, cfg: AppConfig): Promise<number> {
  if (!adzunaEnabled()) return 0;
  let count = 0;
  const groups = await discoverEvaluated(cfg);
  for (const { company, kept } of groups) {
    await upsertOneCompany(db, company);
    for (const ev of kept) {
      await upsertJobAndMatch(db, ev);
      count++;
    }
  }
  return count;
}

async function processBoard(
  db: Db,
  cfg: AppConfig,
  company: CompanyConfig,
  taskId: string,
  etag: string | null,
): Promise<number> {
  const result = await getConnector(company.ats).fetchBoard(company, etag ?? undefined);
  if (result.notModified) {
    await completeTask(db, taskId, result.etag ?? etag);
    return 0;
  }

  const evaluation = evaluateBoard(cfg, company, result.jobs);
  for (const ev of evaluation.kept) {
    await upsertJobAndMatch(db, ev);
  }
  await completeTask(db, taskId, result.etag);
  return evaluation.kept.length;
}

async function upsertJobAndMatch(db: Db, ev: EvaluatedJob): Promise<void> {
  const j = ev.job;
  const id = jobKey(j.ats, j.token, j.externalId);
  const now = new Date();

  await db
    .insert(jobsT)
    .values({
      id,
      externalId: j.externalId,
      companyId: j.companyId,
      source: j.ats,
      title: j.title,
      location: j.location,
      remote: j.remote,
      url: j.url,
      salaryMin: ev.salary?.min ?? null,
      salaryMax: ev.salary?.max ?? null,
      salaryRaw: ev.salary?.raw ?? null,
      descriptionSnippet: j.description.slice(0, 500),
      postedAt: j.postedAt,
      lastSeen: now,
    })
    .onConflictDoUpdate({
      target: jobsT.id,
      set: {
        title: j.title,
        location: j.location,
        remote: j.remote,
        url: j.url,
        salaryMin: ev.salary?.min ?? null,
        salaryMax: ev.salary?.max ?? null,
        salaryRaw: ev.salary?.raw ?? null,
        descriptionSnippet: j.description.slice(0, 500),
        postedAt: j.postedAt,
        lastSeen: now,
      },
    });

  // Update score/eligibility but preserve the user's own tracking (status, dates).
  await db
    .insert(matchesT)
    .values({
      userId: SELF_USER_ID,
      jobId: id,
      score: ev.score,
      scoreReason: ev.reason,
      matchedSkills: ev.matchedSkills,
      levelLabel: ev.levelLabel,
      eligibility: ev.eligibility,
    })
    .onConflictDoUpdate({
      target: [matchesT.userId, matchesT.jobId],
      set: {
        score: ev.score,
        scoreReason: ev.reason,
        matchedSkills: ev.matchedSkills,
        levelLabel: ev.levelLabel,
        eligibility: ev.eligibility,
        updatedAt: now,
      },
    });
}

async function upsertCompanies(db: Db, cfg: AppConfig): Promise<void> {
  for (const c of cfg.companies) await upsertOneCompany(db, c);
}

async function upsertOneCompany(db: Db, c: CompanyConfig): Promise<void> {
  const id = companyId(c.ats, c.token);
  await db
    .insert(companiesT)
    .values({
      id,
      name: c.name,
      tier: c.tier,
      ats: c.ats,
      token: c.token,
      hiresIn: c.hiresIn ?? [],
    })
    .onConflictDoUpdate({
      target: companiesT.id,
      set: { name: c.name, tier: c.tier, hiresIn: c.hiresIn ?? [], updatedAt: new Date() },
    });
}

async function enqueueRefreshTasks(db: Db, cfg: AppConfig): Promise<void> {
  for (const c of cfg.companies) {
    const cid = companyId(c.ats, c.token);
    await db
      .insert(tasksT)
      .values({ id: `refresh:${cid}`, companyId: cid, state: "queued", runAfter: new Date() })
      .onConflictDoUpdate({
        target: tasksT.id,
        set: { state: "queued", runAfter: new Date(), attempts: 0, lastError: null, updatedAt: new Date() },
        // Don't disturb a task another worker is actively running.
        setWhere: sql`${tasksT.state} <> 'running'`,
      });
  }
}

function jobKey(ats: string, token: string, externalId: string): string {
  return createHash("sha1").update(`${ats}:${token}:${externalId}`).digest("hex");
}
