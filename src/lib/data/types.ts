import type { Eligibility } from "@/lib/types";
import type { Tier, Ats } from "@/config/schema";

/** A flat, serializable row the dashboard renders. Shared by DB + preview modes. */
export interface JobRow {
  id: string;
  company: string;
  tier: Tier;
  ats: Ats;
  title: string;
  location: string | null;
  remote: boolean;
  url: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryRaw: string | null;
  eligibility: Eligibility;
  score: number;
  scoreReason: string;
  matchedSkills: string[];
  levelLabel: string;
  status: string; // new | saved | applied | rejected | ghosted
  appliedAt: string | null; // ISO
  firstReplyAt: string | null; // ISO
  postedAt: string | null; // ISO
}

export type JobsMode = "db" | "preview";

export interface JobsResponse {
  mode: JobsMode;
  rows: JobRow[];
  lastRefreshed: string; // ISO
  error?: string;
}
