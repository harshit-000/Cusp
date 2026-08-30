import type { AppConfig } from "@/config/load";
import type { NormalizedJob, Eligibility } from "@/lib/types";
import { RECENCY_WINDOW_DAYS } from "@/config/defaults";

export interface Scored {
  score: number; // 0..100 — a resume-fit percentage
  reason: string;
  matchedSkills: string[]; // which of my skills the role demands
  levelLabel: string; // experience-fit label, e.g. "Right level"
}

/**
 * Resume-shortlisting score (DESIGN.md §6). Like a recruiter screening a résumé:
 * experience must fit first, then how well my expertise matches the role's
 * demanded skills, adjusted for eligibility and recency. Multiplicative, so a
 * weak dimension can't be masked by a strong one.
 *
 *   score = 100 · experienceFit · eligibilityFactor · (skillWeight·skillFit + recencyWeight·recency)
 */
export function scoreJob(
  job: NormalizedJob,
  eligibility: Eligibility,
  cfg: AppConfig,
): Scored {
  const w = cfg.weights;
  const title = job.title.toLowerCase();
  const desc = job.description.toLowerCase();

  // 1) Skill fit — my expertise vs the role's demanded skills.
  const matchedSkills: string[] = [];
  let titleHits = 0;
  let descHits = 0;
  for (const skill of cfg.profile.skills) {
    const s = skill.toLowerCase();
    const inTitle = title.includes(s);
    const inDesc = !inTitle && desc.includes(s);
    if (inTitle || inDesc) matchedSkills.push(skill);
    if (inTitle) titleHits++;
    else if (inDesc) descHits++;
  }
  const weightedHits = titleHits * w.titleSkillBoost + descHits;
  const skillFit = clamp01(weightedHits / w.skillTarget);

  // 2) Experience fit — role seniority + required years vs my experience (first priority).
  const { fit: experienceFit, label: levelLabel } = experienceFitFor(title, desc, cfg);

  // 3) Recency — minor freshness signal.
  const recency = recency01(job.postedAt);

  // 4) Eligibility multiplier.
  const eligFactor =
    eligibility === "eligible"
      ? w.eligibleFactor
      : eligibility === "longshot"
        ? w.longshotFactor
        : w.blockedFactor;

  // 5) Discipline focus — frontend vs backend/infra, read from the title.
  const { factor: focusFactor, offFocus } = disciplineFactor(title, cfg);

  // 6) Location preference — the strongest lever after experience.
  const { fit: locFit, label: locLabel } = locationFit(job, cfg, eligibility);

  const content = w.skillWeight * skillFit + w.recencyWeight * recency;
  const score = Math.round(100 * experienceFit * locFit * eligFactor * focusFactor * content);

  const reason = [
    `${Math.round(skillFit * 100)}% skill fit` +
      (matchedSkills.length ? ` (${matchedSkills.slice(0, 4).join(", ")})` : " (no stack overlap)"),
    levelLabel,
    locLabel || null,
    offFocus ? "off-focus" : null,
    postedLabel(job.postedAt),
    eligibility,
  ]
    .filter(Boolean)
    .join(" · ");

  return { score: clamp(score, 0, 100), reason, matchedSkills, levelLabel };
}

function experienceFitFor(
  title: string,
  desc: string,
  cfg: AppConfig,
): { fit: number; label: string } {
  const w = cfg.weights;
  const sr = cfg.matching.seniority;

  let base: number;
  let label: string;
  if (matchesAny(title, sr.avoid)) {
    base = w.levelAvoid;
    label = "Over-leveled";
  } else if (matchesAny(title, sr.stretch)) {
    base = w.levelStretch;
    label = "Senior — stretch";
  } else if (matchesAny(title, sr.target)) {
    base = w.levelTarget;
    label = "Right level";
  } else {
    base = w.levelUnspecified;
    label = "Level unspecified";
  }

  // Penalize if the role demands clearly more years than I have.
  const req = requiredYears(desc);
  let yearsFactor = 1;
  if (req != null) {
    const mine = cfg.profile.experienceYears;
    if (req <= mine + 1) {
      yearsFactor = 1;
    } else if (req <= mine + 3) {
      yearsFactor = 0.6;
      label = `Needs ${req}y+ exp`;
    } else {
      yearsFactor = 0.3;
      label = `Needs ${req}y+ exp`;
    }
  }

  return { fit: clamp01(base * yearsFactor), label };
}

/** Smallest required-years figure stated near an "experience" cue. */
function requiredYears(desc: string): number | null {
  const nums: number[] = [];
  const patterns = [
    /(\d{1,2})\s*\+\s*years?/g, // "5+ years"
    /(\d{1,2})\s*-\s*\d{1,2}\s*years?/g, // "3-5 years"
    /(\d{1,2})\s*years?\s+of\s+(?:relevant\s+|professional\s+)?experience/g,
  ];
  for (const re of patterns) {
    for (const m of desc.matchAll(re)) {
      const n = parseInt(m[1], 10);
      if (n >= 1 && n <= 20) nums.push(n);
    }
  }
  return nums.length ? Math.min(...nums) : null;
}

/**
 * Location preference — ranks a job by how well its location matches the user's
 * ordered preferences (earlier = better). Disabled (neutral) if unconfigured.
 */
function locationFit(
  job: NormalizedJob,
  cfg: AppConfig,
  eligibility: Eligibility,
): { fit: number; label: string } {
  const w = cfg.weights;
  const pref = cfg.profile.preferredLocations;
  if (pref.length === 0) return { fit: 1, label: "" };

  const hay = (job.location ?? "").toLowerCase();
  // "Remote" only counts as preferred when the role is actually accessible —
  // otherwise a US-only "remote" role would hijack the boost.
  const isRemote = (job.remote || /\bremote\b/.test(hay)) && eligibility === "eligible";

  for (let i = 0; i < pref.length; i++) {
    const p = pref[i].toLowerCase().trim();
    const matched = p === "remote" ? isRemote : hay.includes(p);
    if (matched) {
      const fit = Math.max(w.locationPreferredFloor, w.locationTopFit - i * w.locationRankStep);
      return { fit, label: `📍 ${pref[i]}` };
    }
  }
  if (hay) return { fit: w.locationOtherFit, label: "📍 other" };
  return { fit: w.locationUnknownFit, label: "📍 n/a" };
}

/** Frontend vs backend/infra focus, from the title. Disabled if unconfigured. */
function disciplineFactor(
  title: string,
  cfg: AppConfig,
): { factor: number; offFocus: boolean } {
  const { focus, deprioritize } = cfg.matching;
  if (focus.length === 0 && deprioritize.length === 0) return { factor: 1, offFocus: false };
  if (includesAny(title, focus)) return { factor: 1, offFocus: false };
  if (includesAny(title, deprioritize)) return { factor: cfg.weights.offFocusFactor, offFocus: true };
  return { factor: cfg.weights.neutralFocusFactor, offFocus: false };
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((t) => text.includes(t.toLowerCase()));
}

function recency01(d: Date | null): number {
  if (!d) return 0.5;
  const days = Math.max(0, (Date.now() - d.getTime()) / 86_400_000);
  return clamp01(1 - days / RECENCY_WINDOW_DAYS);
}

function postedLabel(d: Date | null): string {
  if (!d) return "age n/a";
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  return days <= 0 ? "today" : `${days}d old`;
}

function matchesAny(text: string, words: string[]): boolean {
  return words.some((word) => new RegExp(`\\b${escapeRe(word.toLowerCase())}\\b`).test(text));
}
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
function clamp01(n: number): number {
  return clamp(n, 0, 1);
}
