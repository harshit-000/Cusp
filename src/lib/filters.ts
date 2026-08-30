import type { JobRow } from "@/lib/data/types";

/** Eligibility view: active = eligible+longshot (default), eligible = strict, all = incl. blocked. */
export type EligibilityFilter = "active" | "eligible" | "all";

export interface Filters {
  q: string;
  tier: string; // "all" | a Tier value
  eligibility: EligibilityFilter;
  untrackedOnly: boolean;
}

export const DEFAULT_FILTERS: Filters = {
  q: "",
  tier: "all",
  eligibility: "active",
  untrackedOnly: false,
};

/**
 * Pure filtering — shared by the Board (client) so filter changes are instant
 * without refetching. Kept out of components per the logic/UI split.
 */
export function applyFilters(rows: JobRow[], f: Filters): JobRow[] {
  return rows.filter((r) => {
    if (f.tier !== "all" && r.tier !== f.tier) return false;
    if (f.eligibility === "eligible" && r.eligibility !== "eligible") return false;
    if (f.eligibility === "active" && r.eligibility === "blocked") return false;
    if (f.untrackedOnly && r.status !== "new") return false;
    if (f.q) {
      const q = f.q.toLowerCase();
      if (!r.title.toLowerCase().includes(q) && !r.company.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });
}
