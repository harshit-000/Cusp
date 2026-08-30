import type { JobRow } from "@/lib/data/types";

/** Human "posted" label from an ISO date. */
export function postedAgo(iso: string | null): string {
  if (!iso) return "date n/a";
  const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1mo ago" : `${months}mo ago`;
}

/** Freshness bucket used to color the posted label. */
export function freshness(iso: string | null): "fresh" | "recent" | "stale" {
  if (!iso) return "stale";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 3) return "fresh";
  if (days <= 14) return "recent";
  return "stale";
}

/** Display salary — prefer the raw parsed string, fall back to an LPA range. */
export function formatSalary(row: JobRow): string | null {
  if (row.salaryRaw) return row.salaryRaw;
  if (row.salaryMin != null && row.salaryMax != null) {
    return row.salaryMin === row.salaryMax
      ? `₹${row.salaryMin} LPA`
      : `₹${row.salaryMin}–${row.salaryMax} LPA`;
  }
  return null;
}

export function tierLabel(tier: string): string {
  return tier.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
