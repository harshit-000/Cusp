import type { AppConfig } from "@/config/load";

/**
 * Cheap title-based gates run before scoring (DESIGN.md §5.4). Both are fully
 * config-driven — no hardcoded role lists — so the portal stays generic.
 */

/** True if the title contains any `titleExclude` term → drop the job. */
export function isExcludedTitle(title: string, cfg: AppConfig): boolean {
  const t = title.toLowerCase();
  return cfg.matching.titleExclude.some((x) => t.includes(x.toLowerCase()));
}

/** True if the title matches at least one `roleKeyword` (empty list = allow all). */
export function passesRoleGate(title: string, cfg: AppConfig): boolean {
  if (cfg.matching.roleKeywords.length === 0) return true;
  const t = title.toLowerCase();
  return cfg.matching.roleKeywords.some((k) => t.includes(k.toLowerCase()));
}
