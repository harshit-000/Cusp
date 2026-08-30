/**
 * Standalone config validator: `npm run config:check`.
 * Prints a friendly summary if the config is valid, or the exact problems if not.
 * Handy in CI and before a deploy.
 */
import { loadConfig } from "@/config/load";

try {
  const cfg = loadConfig();
  const byTier = cfg.companies.reduce<Record<string, number>>((acc, c) => {
    acc[c.tier] = (acc[c.tier] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`✅ jobscout.config.ts is valid.`);
  console.log(`   Profile: ${cfg.profile.name} · ${cfg.profile.experienceYears}y · ` +
    `₹${cfg.profile.salaryMinLpa}–${cfg.profile.salaryMaxLpa} LPA · ${cfg.profile.basedIn}`);
  console.log(`   Companies: ${cfg.companies.length} (${Object.entries(byTier)
    .map(([t, n]) => `${t}: ${n}`)
    .join(", ")})`);
  process.exit(0);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
