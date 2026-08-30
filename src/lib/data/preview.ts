import { loadConfig } from "@/config/load";
import type { CompanyConfig } from "@/config/schema";
import { getConnector } from "@/lib/connectors";
import { evaluateBoard } from "@/lib/engine/pipeline";
import { discoverEvaluated, adzunaEnabled } from "@/lib/discovery";
import type { EvaluatedJob } from "@/lib/types";
import type { JobRow } from "./types";

/**
 * Live preview: run the pipeline on-demand across all boards (in parallel) and
 * return scored rows WITHOUT a database. Lets the dashboard work before a DB is
 * connected. Cached briefly so filtering/paging doesn't refetch every board.
 */

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_ROWS = 400;

let cache: { at: number; rows: JobRow[] } | null = null;

export async function getPreviewRows(): Promise<JobRow[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.rows;

  const cfg = loadConfig();
  const perCompany = await Promise.all(
    cfg.companies.map(async (company) => {
      try {
        const { jobs } = await getConnector(company.ats).fetchBoard(company);
        return evaluateBoard(cfg, company, jobs).kept.map((ev) => toRow(ev, company));
      } catch {
        return [] as JobRow[];
      }
    }),
  );

  const rows = perCompany.flat();

  // Broad discovery (Adzuna) — only when keys are configured.
  if (adzunaEnabled()) {
    try {
      const groups = await discoverEvaluated(cfg);
      for (const { company, kept } of groups) {
        for (const ev of kept) rows.push(toRow(ev, company));
      }
    } catch {
      // discovery is best-effort in preview; ignore failures
    }
  }

  const ranked = rows.sort((a, b) => b.score - a.score).slice(0, MAX_ROWS);
  cache = { at: Date.now(), rows: ranked };
  return ranked;
}

function toRow(ev: EvaluatedJob, company: CompanyConfig): JobRow {
  const j = ev.job;
  return {
    id: `${j.ats}:${j.token}:${j.externalId}`,
    company: company.name,
    tier: company.tier,
    ats: company.ats,
    title: j.title,
    location: j.location,
    remote: j.remote,
    url: j.url,
    salaryMin: ev.salary?.min ?? null,
    salaryMax: ev.salary?.max ?? null,
    salaryRaw: ev.salary?.raw ?? null,
    eligibility: ev.eligibility,
    score: ev.score,
    scoreReason: ev.reason,
    matchedSkills: ev.matchedSkills,
    levelLabel: ev.levelLabel,
    status: "new",
    appliedAt: null,
    firstReplyAt: null,
    postedAt: j.postedAt ? j.postedAt.toISOString() : null,
  };
}
