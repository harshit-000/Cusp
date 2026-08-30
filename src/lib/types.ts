import type { Ats } from "@/config/schema";

export type Eligibility = "eligible" | "longshot" | "blocked";

/** A job normalized from any ATS into one common shape. */
export interface NormalizedJob {
  externalId: string;
  ats: Ats;
  companyId: string; // `${ats}:${token}`
  company: string;
  token: string;
  title: string;
  location: string | null;
  remote: boolean;
  url: string;
  description: string; // plain text; may be empty
  compensationText?: string; // explicit comp string if the ATS provides one
  postedAt: Date | null;
}

export interface ParsedSalary {
  min: number | null; // LPA when INR detected
  max: number | null;
  raw: string;
}

/** A normalized job after gates + eligibility + scoring. */
export interface EvaluatedJob {
  job: NormalizedJob;
  eligibility: Eligibility;
  score: number;
  reason: string;
  matchedSkills: string[];
  levelLabel: string;
  salary: ParsedSalary | null;
}

export interface BoardEvaluation {
  companyId: string;
  kept: EvaluatedJob[];
  droppedExcluded: number;
  droppedRole: number;
}
