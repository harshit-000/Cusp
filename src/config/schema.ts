import { z } from "zod";

/**
 * The config contract for Cusp.
 *
 * This schema is the single source of truth for what a user can put in
 * `jobscout.config.ts`. Everything personal flows from here — the engine reads
 * no hardcoded user data anywhere else. Optional fields have sensible defaults
 * (see `defaults.ts`), so a minimal config still works.
 */

export const ATS = z.enum([
  "greenhouse",
  "lever",
  "ashby",
  "smartrecruiters",
  "rippling",
  "adzuna", // aggregator (query-driven discovery), not a per-company board
]);
export type Ats = z.infer<typeof ATS>;

export const TIER = z.enum([
  "product_mnc",
  "big_startup",
  "small_startup",
  "service",
]);
export type Tier = z.infer<typeof TIER>;

const nonEmpty = (label: string) =>
  z.string().trim().min(1, `${label} cannot be empty`);

/** A single target company mapped to its ATS board. */
export const companySchema = z.object({
  name: nonEmpty("company.name"),
  tier: TIER,
  ats: ATS,
  /** The company's board slug, e.g. "postman" in boards-api.greenhouse.io/.../postman/jobs */
  token: nonEmpty("company.token"),
  /** Regions the company is known to hire in; helps eligibility scoring. */
  hiresIn: z.array(z.string()).optional(),
});
export type CompanyConfig = z.infer<typeof companySchema>;

/** Who you are and what you want. */
export const profileSchema = z
  .object({
    name: nonEmpty("profile.name"),
    basedIn: nonEmpty("profile.basedIn"),
    locations: z.array(z.string()).min(1, "profile.locations needs at least one entry"),
    // Ordered by preference (most preferred first). Ranks roles by location —
    // the strongest lever after experience. Empty = no location preference.
    preferredLocations: z.array(z.string()).default([]),
    experienceYears: z.number().int().min(0).max(50),
    salaryMinLpa: z.number().nonnegative(),
    salaryMaxLpa: z.number().positive(),
    skills: z.array(z.string()).min(1, "profile.skills needs at least one entry"),
  })
  .refine((p) => p.salaryMaxLpa >= p.salaryMinLpa, {
    message: "profile.salaryMaxLpa must be >= profile.salaryMinLpa",
    path: ["salaryMaxLpa"],
  });

export const senioritySchema = z.object({
  target: z.array(z.string()).default([]),
  stretch: z.array(z.string()).default([]),
  avoid: z.array(z.string()).default([]),
});

/** How jobs are matched and filtered. */
export const matchingSchema = z.object({
  roleKeywords: z.array(z.string()).min(1, "matching.roleKeywords needs at least one entry"),
  seniority: senioritySchema.default({ target: [], stretch: [], avoid: [] }),
  titleExclude: z.array(z.string()).default([]),
  blockPhrases: z.array(z.string()).default([]),
  offStack: z.array(z.string()).default([]),
  // Discipline focus (both optional). A title matching `focus` scores at full
  // weight; one matching `deprioritize` is down-weighted; anything else is
  // neutral. Leave both empty to disable (generic behavior).
  focus: z.array(z.string()).default([]),
  deprioritize: z.array(z.string()).default([]),
  preferredTiers: z.array(TIER).default(["product_mnc", "big_startup"]),
});

/**
 * Optional scoring-weight overrides for the resume-shortlisting model
 * (DESIGN.md §6). Any omitted key falls back to DEFAULT_WEIGHTS.
 *
 *   match% = 100 · experienceFit · eligibilityFactor · (skillWeight·skillFit + recencyWeight·recency)
 */
export const weightsSchema = z
  .object({
    // content mix (should sum to ~1)
    skillWeight: z.number(),
    recencyWeight: z.number(),
    // skillFit normalization
    skillTarget: z.number(), // weighted skill hits needed for a full skillFit
    titleSkillBoost: z.number(), // a skill in the title counts this many hits
    // experienceFit by role seniority (0..1 multipliers)
    levelTarget: z.number(),
    levelUnspecified: z.number(),
    levelStretch: z.number(),
    levelAvoid: z.number(),
    // eligibility multipliers (0..1)
    eligibleFactor: z.number(),
    longshotFactor: z.number(),
    blockedFactor: z.number(),
    // discipline-focus multipliers (0..1)
    offFocusFactor: z.number(),
    neutralFocusFactor: z.number(),
    // location-preference multipliers (0..1)
    locationTopFit: z.number(), // best (rank-0) preferred location
    locationRankStep: z.number(), // fit lost per rank down the preference list
    locationPreferredFloor: z.number(), // floor for any preferred-list match
    locationOtherFit: z.number(), // eligible but not a preferred location
    locationUnknownFit: z.number(), // location unknown
  })
  .partial();
export type Weights = z.infer<typeof weightsSchema>;

/**
 * Broad, query-driven discovery via the Adzuna aggregator (Phase 4). Searches the
 * whole market by keyword + location instead of a fixed company list. Active only
 * when ADZUNA_APP_ID/ADZUNA_APP_KEY are set in .env.
 */
export const discoverySchema = z
  .object({
    keywords: z.array(z.string()).default([]), // empty → derived from roleKeywords
    where: z.string().optional(), // default: profile.basedIn
    country: z.string().default("in"),
    maxDaysOld: z.number().int().positive().default(30),
    pages: z.number().int().min(1).max(10).default(2), // 50 results per page
    excludeServiceCompanies: z.boolean().default(true),
  })
  .optional();
export type DiscoveryConfig = z.output<typeof discoverySchema>;

export const configSchema = z.object({
  profile: profileSchema,
  matching: matchingSchema,
  companies: z.array(companySchema).min(1, "add at least one company"),
  discovery: discoverySchema,
  weights: weightsSchema.optional(),
});

/** What the user writes in jobscout.config.ts (defaulted fields are optional). */
export type JobScoutConfig = z.input<typeof configSchema>;

/** Fully-resolved config after parsing + defaults (what the engine consumes). */
export type ResolvedConfig = z.output<typeof configSchema>;
