import type { Weights } from "./schema";

/**
 * Default weights for the resume-shortlisting score (DESIGN.md §6):
 *
 *   match% = 100 · experienceFit · eligibilityFactor · (skillWeight·skillFit + recencyWeight·recency)
 *
 * Multiplicative by design: a role that doesn't fit your experience OR doesn't
 * demand your skills can't score high just because it's eligible and fresh.
 * Users may override any subset via `weights` in jobscout.config.ts.
 */
export const DEFAULT_WEIGHTS: Required<Weights> = {
  // Content: skills dominate, recency is a minor tiebreaker.
  skillWeight: 0.85,
  recencyWeight: 0.15,

  // skillFit = min(1, (titleHits·titleSkillBoost + descHits) / skillTarget)
  skillTarget: 4,
  titleSkillBoost: 3,

  // experienceFit — how well the role's seniority matches your years.
  levelTarget: 1.0, // e.g. SDE-1/2, mid, associate
  levelUnspecified: 0.85, // generic "Software Engineer" with no level word
  levelStretch: 0.45, // "Senior" — a stretch for junior/mid
  levelAvoid: 0.1, // staff/principal/lead/manager — over-leveled

  // eligibility multipliers.
  eligibleFactor: 1.0,
  longshotFactor: 0.75,
  blockedFactor: 0.35,

  // discipline-focus multipliers (only applied when focus/deprioritize are set).
  offFocusFactor: 0.55, // title is in a discipline I'm de-prioritizing (e.g. backend)
  neutralFocusFactor: 0.85, // title states no clear discipline

  // location-preference multipliers (only applied when preferredLocations is set).
  // Wide spread so location is the strongest lever after experience.
  locationTopFit: 1.0, // rank-0 preferred location (your top choice)
  locationRankStep: 0.1, // each step down the list (rank1 = 0.9, rank2 = 0.8, …)
  locationPreferredFloor: 0.55, // any preferred match stays at least this high
  locationOtherFit: 0.5, // eligible but not on the preference list
  locationUnknownFit: 0.7, // location not stated
};

/** Recency window (days) over which freshness decays from 1 → 0. */
export const RECENCY_WINDOW_DAYS = 60;
