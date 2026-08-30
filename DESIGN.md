# Cusp — Design Specification

> A hosted, daily job-intelligence dashboard that helps a 2–3 YoE engineer switch
> from a service-based / small-startup role into a **product-based MNC or well-known
> big startup**, targeting a **strong product-company salary band**.

**Status:** Design locked · Build approach: **rebuild from scratch** (our own code,
borrowing proven patterns — not forking).
**Reference blueprint:** [`VaishnavGhenge/jobscout`](https://github.com/VaishnavGhenge/jobscout)
(patterns/architecture reused; no source copied).

---

## 1. The problem

The bottleneck isn't *finding* jobs — LinkedIn already floods you. It's filtering the
firehose down to the ~2% of roles that are:

1. **Product-based** at a well-known company (not another service shop),
2. In a target salary band for 2–3 YoE,
3. A **stack/role match** (Java / Spring Boot / microservices),
4. **Eligible** (India-based, no US-visa/clearance walls),
5. **Fresh** — so you apply before the role is buried under 800 applicants.

Cusp is a **personalized job-intelligence dashboard**, not a job board. One
ranked list each morning of the handful of roles that actually fit — freshest first.

---

## 2. Core principles (decisions we locked)

| Principle | Rationale |
|---|---|
| **Freshness > perfect match** | Being early beats being ideal. A fresh role you can be first to > a perfect stale one. Freshness is a top scoring signal. |
| **Salary is parsed, never a filter** | Most Indian postings (and nearly all big-company ATS boards) list no pay. Gating on salary would *hide your best jobs*. We parse & display it when present; we proxy pay via **company tier + role level** instead. |
| **Eligibility gate is essential** | India-based search must auto-hide US-only / visa / clearance roles before they waste your attention. |
| **Curated companies + broad discovery** | ATS boards = a hand-picked seed list (high quality). Adzuna = discovery *beyond* the list (Phase 2). Two complementary sources. |
| **Transparent additive scoring, no AI in v1** | Explainable ("why 85%"), instant, free, tunable in one config file. AI resume-scoring is a later, optional layer. |
| **Single-user now, multi-user-ready schema** | One user (you) today; model data as if multi-user so adding auth later is zero rework. |

---

## 3. Architecture

```
   ┌──────────────────────┐        ┌──────────────────────┐
   │  ATS endpoints        │        │  Adzuna API (Phase 2)│
   │  Greenhouse · Lever · │        │  broad IN discovery  │
   │  Ashby · SmartRecr. · │        │  beyond the seed list│
   │  Rippling             │        └──────────┬───────────┘
   └──────────┬───────────┘                   │
              │        curated seed (~60 cos)  │
              ▼                                ▼
   ┌─────────────────────────────────────────────────────┐
   │  Ingestion (daily cron + 6-hourly GH Action)         │
   │  durable Postgres queue → per-board worker           │
   │  fetch → normalize → dedupe → eligibility gate →     │
   │  role/title gate → tier-tag → score → parse salary   │
   └───────────────────────────┬─────────────────────────┘
                               ▼
                    ┌────────────────────┐
                    │  Postgres (Neon /  │
                    │  Supabase)         │
                    └─────────┬──────────┘
                              ▼
        ┌───────────────────────────────────────────┐
        │  Next.js web dashboard                     │
        │  Board · Tracker · Insights · Tier filter  │
        └───────────────────────────────────────────┘
                              │
                              ▼  (Phase 3)
                   morning Telegram / email nudge
```

### Stack

- **App:** Next.js (App Router) + TypeScript — one project, API routes handle ingestion + serving.
- **DB:** PostgreSQL (Neon **or** Supabase free tier) + Drizzle ORM.
- **Scheduling:** Vercel Cron (daily) + GitHub Actions (6-hourly, to beat Vercel's daily-cron limit).
- **Deploy:** Vercel free tier. Target running cost: **₹0/month.**
- **Config:** a single `profile.ts` — all tuning (skills, salary band, tiers, block phrases, seniority) in one file.

---

## 4. Data model

Modeled multi-user-ready from day one (one `User` row today = you).

```
User      : id · email · created_at
Profile   : user_id · skills[] · salary_min_lpa · salary_max_lpa ·
            tiers[] · locations[] · role_keywords[] · seniority bands ...

Company   : id · name · ats · token · tier · hires_in[]
            # ats ∈ {greenhouse, lever, ashby, smartrecruiters, rippling, adzuna}
            # tier ∈ {product_mnc, big_startup, small_startup, service}

Job       : id · source · company_id · title · location · remote ·
            salary_min · salary_max · salary_raw · skills[] ·
            eligibility(eligible|longshot|blocked) · score · score_reason ·
            posted_at · first_seen · url

Match     : user_id · job_id · score · status(new|saved|applied|rejected|ghosted)
            # per-user; becomes the application tracker

Task      : id · company_id · state(queued|running|failed|dead) · attempts ·
            run_after · lease_until · etag   # durable ingestion queue
```

Note: **jobs are global/shared**; the per-user `Match` row carries score + status.
`Match.status` doubles as the application tracker for free.

---

## 5. The ingestion engine (reimplemented from reference patterns)

### 5.1 Durable Postgres queue

Each company-board refresh is one independent task, so a serverless timeout never
loses progress.

- **Atomic claim:** `SELECT … FOR UPDATE SKIP LOCKED` picks a claimable task
  (queued/failed with `run_after` past, or running with expired lease) and in the
  same statement bumps attempts, sets `running`, and takes a ~120s lease.
  Concurrent workers can never grab the same row.
- **Lease-based recovery:** a dead worker's row just has an expired lease; the next
  worker reclaims it. No janitor process, nothing lost.
- **Backoff:** failed → retry 20s, 40s, 80s … capped 30min, jittered. Honor
  `Retry-After` when the server sends it. After 4 attempts → `dead`.
- **`releaseTask`:** hand a task back when time-boxed, refunding the attempt so
  healthy boards aren't killed by scheduling delays.
- **ETags:** conditional requests per board to minimize bandwidth.

### 5.2 ATS connectors

One adapter per platform, each normalizing to the common `Job` shape:

| ATS | Endpoint pattern |
|---|---|
| Greenhouse | `boards-api.greenhouse.io/v1/boards/{token}/jobs` |
| Lever | `api.lever.co/v0/postings/{token}?mode=json` |
| Ashby | `api.ashbyhq.com/posting-api/job-board/{token}` |
| SmartRecruiters | `api.smartrecruiters.com/v1/companies/{token}/postings` |
| Rippling | `api.rippling.com/platform/api/ats/v1/board/{token}/jobs` |

SmartRecruiters & Rippling need per-posting detail fetches — do so **only** when a
description could change the eligibility verdict (big call-count savings).

### 5.3 Eligibility gate (3-way verdict)

`assessEligibility(job, profile, company) → eligible | longshot | blocked`

Inputs: parsed regions (location + locations + countryCode + title) × block phrases
(visa / clearance / US-residency) × company hiring footprint (`hires_in`).

- **Eligible** — posted in your region without blockers, or a global listing from a
  company that hires in India.
- **Longshot** — in-region but has blocker phrases; broad match ("APAC"); global
  listing from a company with no India presence; or unclear location from a company
  that hires locally elsewhere.
- **Blocked** — blocker phrases on a global listing; title pins the role elsewhere;
  posted in a sponsorship-requiring region; or unclear location + no local hiring
  history.

Key nuance: exact region match ("India", "Bengaluru") is a strong signal; broad
regions ("APAC") tell us nothing India-specific.

### 5.4 Role / title gates

- **Engineering gate:** keep only titles containing engineer / developer / backend /
  full stack / SDE / etc.
- **Title exclusions:** ~50 non-IC titles (sales engineer, QA, Salesforce admin, IT
  support, PM, "talent pool", …) removed.
- **Repost blocklist:** exclude aggregators that hide the real employer (Jobgether,
  Weekday AI, …).

### 5.5 Salary parsing (display-only)

Regex handles `₹25L–35L`, `$150k–200k`, `₹30,00,000`, LPA / lakh / crore. Guards:
must sit near comp keywords (CTC / compensation / annual), reject `/hour` & per-month,
floor at ₹100k / $20k, require a currency marker. **Never feeds the score.**

---

## 6. Scoring (transparent, additive, 0–100)

```
score = clamp(0 .. ceiling,
    base            (30)
  + eligibility     (eligible +25 · longshot +12 · blocked → 0, caps score at 15)
  + freshness       (<3d +25 · … · 3mo+ −30 · unknown age small +)
  + roleMatch       (+12 if title matches your role keywords)
  + seniority       (target +12 · stretch penalty · avoid heavy penalty)
  + stack           (title tech = full · desc-only tech = half · off-stack −)
  + tier            (OUR ADD: product_mnc / big_startup bonus)     ← new term
)
ceiling = 15 if blocked, else 100
```

Every job shows a **score reason** ("85% · 4/5 skills · fresh 2d · Product MNC ·
eligible") so ranking is explainable. All weights live in `profile.ts`.

---

## 7. The web dashboard

- **Board** — ranked roles with score, freshness, eligibility, and the score reason.
  Filters: **tier** (our add — "Product MNC only"), "untracked only", eligibility.
  Salary shown when parsed.
- **Tracker** — application pipeline via `Match.status`; auto-mark **ghosted** after
  21 days of silence; records applied date & first reply.
- **Insights** — reply-rate funnel segmented by eligibility, posting age, remote,
  company, and board — reveals which application types actually get responses.

---

## 8. What we add over the reference (our differentiators)

| Add | Plugs in at | Touches core engine? |
|---|---|---|
| **Company-tier tagging** + Board tier filter | one `Company.tier` field + one scoring term | No |
| **Adzuna broad discovery** (Phase 2) | a new connector alongside ATS + auto-tier unknown companies | No |
| **Morning nudge** (Telegram / email) | reads dashboard data, sends a digest | No |
| **AI resume-match & referral hints** (later) | optional scoring layer + LinkedIn connection lookup | No |

All are non-invasive bolt-ons, designed into the architecture from the start.

---

## 9. Roadmap

- **Phase 1 — Core loop (ATS-first).**
  Scaffold Next.js + Drizzle + Postgres · `profile.ts` seeded with *your* details
  (React / TypeScript / Next.js, target band, India) · durable queue · Greenhouse +
  Lever connectors · eligibility + role gates · additive scoring + tier term · Board
  view. **Goal: prove the pipeline end-to-end.** _(See §10–§12 for the finalized
  profile, verified company watchlist, and updated roadmap.)_
- **Phase 2 — Full ATS + discovery.**
  Add Ashby / SmartRecruiters / Rippling · seed ~60 target companies with tiers ·
  **Adzuna** discovery beyond the seed list + auto-tiering.
- **Phase 3 — Tracking + nudge.**
  Application tracker with 21-day ghosting · Insights funnel · morning Telegram/email
  digest.
- **Phase 4 — Edges.**
  AI resume-match scoring · referral hints · (if desired) multi-user auth via
  Supabase Auth.

---

## 10. Your profile (seed for `profile.ts`)

An example profile — a **Frontend Engineer, 2+ yrs**.

```
name:              Your Name
based_in:          India
locations:         [Bengaluru, Hyderabad, Remote]
experience_years:  2
salary_min_lpa:    <your min>
salary_max_lpa:    <your max>

skills:            [React, TypeScript, Next.js, Node.js, JavaScript, Go,
                    Material UI, SASS, Styled Components, Nx Monorepos, tRPC,
                    React Query, Zustand, React Hook Form, GraphQL, Vite, Zod]
domains:           [Fintech, Derivatives/Crypto trading, Industrial IoT]

company_tiers:     [product_mnc, big_startup]
role_keywords:     [Frontend, "Front End", "Front-End", React, "UI Engineer",
                    "Software Engineer", "Web Developer", "Full Stack", SDE]
seniority_target:  [SDE-1, SDE-2, mid, associate, "II", "2"]
seniority_stretch: [senior]      # visible but penalized
seniority_avoid:   [intern, staff, principal, manager, architect, lead, director]

block_phrases:     ["US citizen", "security clearance", "must be authorized to work in the US",
                    "US residency", "GC required"]
title_exclude:     [QA, SDET, Salesforce, "IT support", "Sales Engineer",
                    "Product Manager", "Program Manager", intern, "talent pool"]
off_stack:         [Android, iOS, "Machine Learning", "Data Engineer", DevOps]  # rank lower
```

## 11. Target company watchlist (verified against live ATS endpoints)

Probed on 2026-08-30. **Reachable** = our connectors can pull it directly today.

### ✅ Reachable now (Phase 1 seed — 11 companies)

Skewed toward React/TypeScript shops — a strong fit for the profile above.

| Company | Tier | ATS | Token | Notes |
|---|---|---|---|---|
| **Groww** | big_startup | greenhouse | `groww` | ⭐ your pick; small board, watch closely |
| **CRED** | big_startup | lever | `cred` | React-heavy product |
| **Postman** | big_startup | greenhouse | `postman` | 63 roles; React/TS |
| **Notion** | big_startup | ashby | `notion` | React |
| **Linear** | big_startup | ashby | `linear` | React/TS, remote-friendly |
| **Ramp** | big_startup | ashby | `ramp` | frontend roles |
| **HackerRank** | big_startup | greenhouse | `hackerrank` | Bengaluru + remote |
| **Stripe** | product_mnc | greenhouse | `stripe` | 100+ roles |
| **GitLab** | product_mnc | greenhouse | `gitlab` | fully remote |
| **MongoDB** | product_mnc | greenhouse | `mongodb` | India offices |
| **Databricks** | product_mnc | greenhouse | `databricks` | Bengaluru |

### ⚠️ Not reachable by ATS connectors → need Adzuna (Phase 2) or a Workday connector

Includes most big MNCs. They run Workday / SuccessFactors / own portals — no
public Greenhouse-style JSON.

| Company | Tier | Platform | Path to reach it |
|---|---|---|---|
| **Mastercard** | product_mnc | Workday | Workday connector / Adzuna |
| **Deutsche Bank** | product_mnc | SuccessFactors | Adzuna / manual |
| **Deutsche Telekom** | product_mnc | own portal | Adzuna / manual |
| **Swiggy** | big_startup | own / Darwinbox | Adzuna / manual |
| Razorpay | big_startup | own (token unconfirmed) | re-probe SmartRecruiters / Adzuna |
| Meesho | big_startup | own | Adzuna / manual |
| PhonePe | big_startup | own | Adzuna / manual |

> **Design implication:** since 3 of your 5 named companies (Mastercard, Deutsche
> Bank, Deutsche Telekom) run **Workday**, a **Workday connector** is worth adding
> to Phase 2 alongside Adzuna — it would unlock a whole tier of MNCs, not just these.

---

## 12. Roadmap (updated)

- **Phase 1 — Core loop (ATS-first).** Scaffold · `profile.ts` seeded with the profile
  above · durable queue · Greenhouse + Lever + Ashby connectors · the 11 verified
  companies · eligibility + role gates · scoring + tier term · Board view.
- **Phase 2 — Discovery + MNC reach.** SmartRecruiters/Rippling connectors ·
  **Adzuna** broad discovery + auto-tiering · **Workday connector** (unlocks
  Mastercard / Deutsche Bank / most MNCs) · re-probe Razorpay/Meesho/PhonePe.
- **Phase 3 — Tracking + nudge.** Tracker w/ 21-day ghosting · Insights funnel ·
  morning Telegram/email digest.
- **Phase 4 — Edges.** AI resume-match scoring (using your résumé) ·
  referral hints · optional multi-user auth.

---

*Design settled through Q&A; profile + watchlist verified against live endpoints
on 2026-08-30. Next step: scaffold the project (Phase 1).*
