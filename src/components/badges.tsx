import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import type { Eligibility } from "@/lib/types";
import { tierLabel } from "@/lib/format";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

const TIER_VARIANT: Record<string, BadgeVariant> = {
  product_mnc: "success",
  big_startup: "warning",
  small_startup: "default",
  service: "default",
};

export function TierBadge({ tier }: { tier: string }) {
  return <Badge variant={TIER_VARIANT[tier] ?? "default"}>{tierLabel(tier)}</Badge>;
}

const ELIGIBILITY: Record<Eligibility, { variant: BadgeVariant; label: string }> = {
  eligible: { variant: "success", label: "Eligible" },
  longshot: { variant: "warning", label: "Longshot" },
  blocked: { variant: "destructive", label: "Blocked" },
};

export function EligibilityBadge({ value }: { value: Eligibility }) {
  const e = ELIGIBILITY[value];
  return <Badge variant={e.variant}>{e.label}</Badge>;
}

const STATUS: Record<string, { variant: BadgeVariant; label: string }> = {
  saved: { variant: "primary", label: "Saved" },
  applied: { variant: "warning", label: "Applied" },
  rejected: { variant: "destructive", label: "Rejected" },
  ghosted: { variant: "default", label: "Ghosted" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status];
  if (!s) return null; // "new" shows nothing
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
