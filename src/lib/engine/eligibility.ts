import type { CompanyConfig } from "@/config/schema";
import type { AppConfig } from "@/config/load";
import type { NormalizedJob, Eligibility } from "@/lib/types";

const BORDERLESS = /(remote|anywhere|worldwide|global|distributed)/i;

/**
 * Three-way eligibility verdict (DESIGN.md §5.3): eligible | longshot | blocked.
 * Combines parsed location, block phrases (visa/clearance), and the company's
 * known hiring footprint. Tuned so an India-based search auto-hides US-only roles.
 */
export function assessEligibility(
  job: NormalizedJob,
  cfg: AppConfig,
  company: CompanyConfig,
): Eligibility {
  const text = [job.title, job.location ?? ""].join(" ").toLowerCase();
  const blob = `${text} ${job.description.toLowerCase()}`;

  // My eligible location tokens (drop generic "remote" — handled as borderless).
  const locationTokens = [cfg.profile.basedIn, ...cfg.profile.locations]
    .map((t) => t.toLowerCase().trim())
    .filter((t) => t && t !== "remote");

  const hasBlocker = cfg.matching.blockPhrases.some((p) =>
    blob.includes(p.toLowerCase()),
  );
  const locationMatchesMe = locationTokens.some((tok) => text.includes(tok));
  const isBorderless = job.remote || BORDERLESS.test(text);
  const companyHiresHere = (company.hiresIn ?? []).some((h) => {
    const hl = h.toLowerCase();
    return (
      hl === "anywhere" ||
      hl === "global" ||
      hl === cfg.profile.basedIn.toLowerCase() ||
      locationTokens.includes(hl)
    );
  });

  // Posted in my region.
  if (locationMatchesMe) return hasBlocker ? "longshot" : "eligible";

  // Global / remote-anywhere.
  if (isBorderless) {
    if (hasBlocker) return "blocked";
    return companyHiresHere ? "eligible" : "longshot";
  }

  // A concrete location that isn't mine and isn't borderless → pinned elsewhere.
  if (job.location && job.location.trim()) return "blocked";

  // Unknown location — lean on company footprint.
  return companyHiresHere ? "longshot" : "blocked";
}
