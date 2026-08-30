import { eq, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { jobs, matches, companies } from "@/db/schema";
import { SELF_USER_ID } from "@/lib/constants";
import type { JobRow } from "./types";

/** Read scored jobs for the current user from the database, ranked by score. */
export async function getStoredRows(limit = 400): Promise<JobRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: jobs.id,
      company: companies.name,
      tier: companies.tier,
      ats: companies.ats,
      title: jobs.title,
      location: jobs.location,
      remote: jobs.remote,
      url: jobs.url,
      salaryMin: jobs.salaryMin,
      salaryMax: jobs.salaryMax,
      salaryRaw: jobs.salaryRaw,
      eligibility: matches.eligibility,
      score: matches.score,
      scoreReason: matches.scoreReason,
      matchedSkills: matches.matchedSkills,
      levelLabel: matches.levelLabel,
      status: matches.status,
      appliedAt: matches.appliedAt,
      firstReplyAt: matches.firstReplyAt,
      postedAt: jobs.postedAt,
    })
    .from(matches)
    .innerJoin(jobs, eq(matches.jobId, jobs.id))
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(eq(matches.userId, SELF_USER_ID))
    .orderBy(desc(matches.score))
    .limit(limit);

  return rows.map((r) => ({
    ...r,
    tier: r.tier as JobRow["tier"],
    ats: r.ats as JobRow["ats"],
    eligibility: r.eligibility as JobRow["eligibility"],
    matchedSkills: r.matchedSkills ?? [],
    levelLabel: r.levelLabel ?? "",
    appliedAt: r.appliedAt ? r.appliedAt.toISOString() : null,
    firstReplyAt: r.firstReplyAt ? r.firstReplyAt.toISOString() : null,
    postedAt: r.postedAt ? r.postedAt.toISOString() : null,
  }));
}
