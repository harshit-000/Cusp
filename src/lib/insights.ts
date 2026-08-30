import type { JobRow } from "@/lib/data/types";
import { tierLabel } from "@/lib/format";

export interface Segment {
  key: string;
  label: string;
  applied: number;
  replied: number;
}

export interface Insights {
  saved: number;
  applied: number; // ever applied (incl. rejected/ghosted)
  replied: number;
  rejected: number;
  ghosted: number;
  replyRate: number | null; // replied / applied
  byTier: Segment[];
  byEligibility: Segment[];
}

const ELIG_LABEL: Record<string, string> = {
  eligible: "Eligible",
  longshot: "Longshot",
  blocked: "Blocked",
};

/** Aggregate tracker data into a reply-rate funnel. Pure — no data access. */
export function buildInsights(rows: JobRow[]): Insights {
  const appliedRows = rows.filter((r) => r.appliedAt != null);
  const replied = appliedRows.filter((r) => r.firstReplyAt != null).length;

  const segment = (keyOf: (r: JobRow) => string, labelOf: (k: string) => string): Segment[] => {
    const map = new Map<string, Segment>();
    for (const r of appliedRows) {
      const key = keyOf(r);
      const seg = map.get(key) ?? { key, label: labelOf(key), applied: 0, replied: 0 };
      seg.applied += 1;
      if (r.firstReplyAt != null) seg.replied += 1;
      map.set(key, seg);
    }
    return [...map.values()].sort((a, b) => b.applied - a.applied);
  };

  return {
    saved: rows.filter((r) => r.status === "saved").length,
    applied: appliedRows.length,
    replied,
    rejected: rows.filter((r) => r.status === "rejected").length,
    ghosted: rows.filter((r) => r.status === "ghosted").length,
    replyRate: appliedRows.length ? replied / appliedRows.length : null,
    byTier: segment(
      (r) => r.tier,
      (k) => tierLabel(k),
    ),
    byEligibility: segment(
      (r) => r.eligibility,
      (k) => ELIG_LABEL[k] ?? k,
    ),
  };
}
