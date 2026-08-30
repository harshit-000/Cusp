import type { AppConfig } from "@/config/load";
import type { CompanyConfig } from "@/config/schema";
import type { NormalizedJob, EvaluatedJob } from "@/lib/types";
import { httpJson, stripHtml, cleanLocation } from "@/lib/http";
import { evaluateBoard } from "@/lib/engine/pipeline";
import { classifyEmployer } from "@/lib/engine/tier";

/**
 * Broad, query-driven discovery via Adzuna (Phase 4). Searches the whole market
 * by keyword + location, auto-tags each employer's tier, and runs results through
 * the same gate → eligibility → score pipeline as the ATS boards.
 */

export function adzunaEnabled(): boolean {
  return Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
}

interface AdzunaJob {
  id: string | number;
  title?: string;
  description?: string;
  redirect_url?: string;
  created?: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  salary_min?: number;
  salary_max?: number;
}
interface AdzunaResponse {
  results?: AdzunaJob[];
}

async function fetchAdzuna(cfg: AppConfig): Promise<NormalizedJob[]> {
  const appId = process.env.ADZUNA_APP_ID!;
  const appKey = process.env.ADZUNA_APP_KEY!;
  const d = cfg.discovery;
  const country = d?.country ?? "in";
  const where = d?.where ?? cfg.profile.basedIn;
  const keywords = d?.keywords?.length ? d.keywords : cfg.matching.roleKeywords;
  const whatOr = keywords.join(" ");
  const pages = d?.pages ?? 2;
  const maxDaysOld = d?.maxDaysOld ?? 30;

  const out: NormalizedJob[] = [];
  for (let page = 1; page <= pages; page++) {
    const url =
      `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}` +
      `?app_id=${appId}&app_key=${appKey}&results_per_page=50` +
      `&what_or=${encodeURIComponent(whatOr)}&where=${encodeURIComponent(where)}` +
      `&max_days_old=${maxDaysOld}&content-type=application/json`;

    const res = await httpJson<AdzunaResponse>(url);
    const results = res.data?.results ?? [];
    for (const j of results) out.push(normalize(j));
    if (results.length < 50) break; // last page
  }
  return out;
}

function normalize(j: AdzunaJob): NormalizedJob {
  const employer = j.company?.display_name?.trim() || "Undisclosed";
  const token = slugify(employer);
  const locDisplay = j.location?.display_name ?? "";
  return {
    externalId: String(j.id),
    ats: "adzuna",
    companyId: `adzuna:${token}`,
    company: employer,
    token,
    title: stripHtml(j.title),
    location: cleanLocation(locDisplay),
    remote: /remote/i.test(locDisplay) || /remote/i.test(j.title ?? ""),
    url: j.redirect_url ?? "",
    description: stripHtml(j.description),
    compensationText: formatSalary(j.salary_min, j.salary_max),
    postedAt: j.created ? new Date(j.created) : null,
  };
}

/** Adzuna salaries are numeric annual (INR for country=in) → an LPA string the parser reads. */
function formatSalary(min?: number, max?: number): string | undefined {
  if (!min || min < 100000) return undefined;
  const lo = (min / 100000).toFixed(1);
  const hi = max && max >= min ? (max / 100000).toFixed(1) : lo;
  return `₹${lo}L - ₹${hi}L per annum`;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unknown";
}

export interface DiscoveredGroup {
  company: CompanyConfig;
  kept: EvaluatedJob[];
}

/**
 * Fetch + evaluate discovery jobs, grouped by employer with an auto-tagged tier.
 * Reused by both the ingest worker (to persist) and the live preview.
 */
export async function discoverEvaluated(cfg: AppConfig): Promise<DiscoveredGroup[]> {
  if (!adzunaEnabled()) return [];
  const excludeService = cfg.discovery?.excludeServiceCompanies !== false;

  const jobs = await fetchAdzuna(cfg);
  const groups = new Map<string, { company: CompanyConfig; jobs: NormalizedJob[] }>();

  for (const job of jobs) {
    const tier = classifyEmployer(job.company);
    if (excludeService && tier === "service") continue;
    let g = groups.get(job.companyId);
    if (!g) {
      g = {
        company: { name: job.company, tier, ats: "adzuna", token: job.token, hiresIn: [cfg.profile.basedIn] },
        jobs: [],
      };
      groups.set(job.companyId, g);
    }
    g.jobs.push(job);
  }

  return [...groups.values()].map((g) => ({
    company: g.company,
    kept: evaluateBoard(cfg, g.company, g.jobs).kept,
  }));
}
