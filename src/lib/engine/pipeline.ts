import type { CompanyConfig } from "@/config/schema";
import type { AppConfig } from "@/config/load";
import type { NormalizedJob, EvaluatedJob, BoardEvaluation } from "@/lib/types";
import { companyId } from "@/lib/connectors";
import { isExcludedTitle, passesRoleGate } from "./gates";
import { assessEligibility } from "./eligibility";
import { scoreJob } from "./scoring";
import { parseSalary } from "./salary";

/**
 * Pure evaluation: normalized jobs → gated, scored, sorted results. No DB, no
 * network — so it's reusable by both the ingest worker and the `probe` script,
 * and trivially testable.
 */
export function evaluateBoard(
  cfg: AppConfig,
  company: CompanyConfig,
  jobs: NormalizedJob[],
): BoardEvaluation {
  const kept: EvaluatedJob[] = [];
  let droppedExcluded = 0;
  let droppedRole = 0;

  for (const job of jobs) {
    if (isExcludedTitle(job.title, cfg)) {
      droppedExcluded++;
      continue;
    }
    if (!passesRoleGate(job.title, cfg)) {
      droppedRole++;
      continue;
    }
    const eligibility = assessEligibility(job, cfg, company);
    const { score, reason, matchedSkills, levelLabel } = scoreJob(job, eligibility, cfg);
    const salary = parseSalary(job.description, job.compensationText);
    kept.push({ job, eligibility, score, reason, matchedSkills, levelLabel, salary });
  }

  kept.sort((a, b) => b.score - a.score);
  return {
    companyId: companyId(company.ats, company.token),
    kept,
    droppedExcluded,
    droppedRole,
  };
}
