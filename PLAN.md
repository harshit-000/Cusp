# Cusp — Phased Build Plan

> **Companion to [`DESIGN.md`](./DESIGN.md).** DESIGN.md = *what & why* (architecture,
> data model, scoring). This file = *how & when* (phases, tasks, acceptance criteria).

## North Star

A **generic, config-driven job-intelligence portal**. Anyone clones the repo,
edits **one file** to describe themselves and their target companies, sets a `.env`,
deploys — and gets a personalized daily dashboard of ranked, filtered jobs.

> **The core promise:** *Edit `jobscout.config.ts`, set `.env`, deploy. That's it.*

---

## The "single file" contract (the heart of the product)

Everything personal lives in **`jobscout.config.ts`** at the repo root. The engine
reads only from here — **zero hardcoded user data anywhere else.** The example
profile ships as the committed default; each user overwrites it with their own.

```ts
// jobscout.config.ts — the ONE file a new user edits
export const config = {
  profile: {
    name: "Your Name",
    basedIn: "India",
    locations: ["Bengaluru", "Hyderabad", "Remote"],
    experienceYears: 2,
    salaryMinLpa: 0, // set your target band
    salaryMaxLpa: 0,
    skills: ["React", "TypeScript", "Next.js", "Node.js", "Go", "GraphQL"],
  },

  matching: {
    roleKeywords: ["Frontend", "React", "UI Engineer", "Software Engineer", "Full Stack"],
    seniority: {
      target:  ["SDE-1", "SDE-2", "mid", "associate", "II"],
      stretch: ["senior"],
      avoid:   ["intern", "staff", "principal", "manager", "architect", "lead"],
    },
    titleExclude: ["QA", "SDET", "Sales Engineer", "Product Manager", "intern"],
    blockPhrases: ["US citizen", "security clearance", "US residency", "GC required"],
    offStack: ["Android", "iOS", "Machine Learning", "Data Engineer"],
    preferredTiers: ["product_mnc", "big_startup"],
  },

  // The user's own target companies. Ships with a verified default set.
  companies: [
    { name: "Groww",      tier: "big_startup", ats: "greenhouse", token: "groww" },
    { name: "CRED",       tier: "big_startup", ats: "lever",      token: "cred" },
    { name: "Postman",    tier: "big_startup", ats: "greenhouse", token: "postman" },
    { name: "Notion",     tier: "big_startup", ats: "ashby",      token: "notion" },
    { name: "Linear",     tier: "big_startup", ats: "ashby",      token: "linear" },
    { name: "Ramp",       tier: "big_startup", ats: "ashby",      token: "ramp" },
    { name: "HackerRank", tier: "big_startup", ats: "greenhouse", token: "hackerrank" },
    { name: "Stripe",     tier: "product_mnc", ats: "greenhouse", token: "stripe" },
    { name: "GitLab",     tier: "product_mnc", ats: "greenhouse", token: "gitlab" },
    { name: "MongoDB",    tier: "product_mnc", ats: "greenhouse", token: "mongodb" },
    { name: "Databricks", tier: "product_mnc", ats: "greenhouse", token: "databricks" },
  ],

  // Optional weight overrides; sensible defaults apply if omitted.
  weights: { base: 30, eligible: 25, longshot: 12, roleMatch: 12, tierBonus: 10 },
} satisfies JobScoutConfig;
```

**Secrets are NEVER in this file.** They live in `.env` (git-ignored):
```
DATABASE_URL=...        # Neon or Supabase Postgres
ADZUNA_APP_ID=...       # Phase 4
ADZUNA_APP_KEY=...      # Phase 4
TELEGRAM_BOT_TOKEN=...  # Phase 5
```

**Validation:** the config is parsed by a **Zod schema** on startup. A bad/missing
field fails fast with a plain-English message ("`salaryMinLpa` must be a number"),
so a non-expert editor is guided, not left with a cryptic crash.

---

## Guardrails that keep it generic (apply to every phase)

1. **No personal data outside `jobscout.config.ts`.** If the engine needs a value,
   it comes from config. PR-review check: grep for hardcoded names/companies = fail.
2. **Every knob has a default.** Omitting an optional field never breaks the build.
3. **Config is validated, not trusted.** Zod parse + friendly errors at boot.
4. **Docs-first.** README's first section is "Make it yours in 5 minutes."
5. **Sensible zero-config demo.** Fresh clone runs with the shipped default config so
   people see it work *before* editing.

---

## Phase overview

| Phase | Title | Outcome | Depends on |
|---|---|---|---|
| 0 | Foundation & config contract | Clone → edit config → app boots | — |
| 1 | Ingestion core loop (ATS) | Cron fills DB with scored, filtered jobs | 0 |
| 2 | Dashboard — Board | User sees ranked matches in browser | 1 |
| 3 | Tracker + Insights | Track applications; see reply rates | 2 |
| 4 | Discovery + MNC reach | Adzuna + Workday + more ATS | 1 |
| 5 | Nudge + deploy | Daily digest; one-command deploy | 2 |
| 6 | Edges (optional) | AI match · multi-user · referrals | 2 |

---

## Phase 0 — Foundation & the config contract

**Goal:** the skeleton + the single-file promise, before any job logic.

**Tasks**
- [ ] Scaffold Next.js (App Router) + TypeScript + ESLint/Prettier.
- [ ] Add Drizzle ORM + Postgres driver; wire `DATABASE_URL`.
- [ ] Define `JobScoutConfig` type + **Zod schema** (`src/config/schema.ts`).
- [ ] Create root `jobscout.config.ts` with the example verified default (see above).
- [ ] Config loader that validates on boot and surfaces friendly errors.
- [ ] `.env.example` + git-ignore `.env`.
- [ ] `README.md` → "Make it yours in 5 minutes" as the first section.
- [ ] `npm run dev` boots and prints "Loaded config for <name>: N companies".

**Acceptance:** a stranger clones, edits `jobscout.config.ts`, runs `npm run dev`,
and sees their name + company count. No jobs yet — the *contract* works.

---

## Phase 1 — Ingestion core loop (ATS-first)

**Goal:** turn config → real scored, filtered jobs in the DB. The engine.

**Tasks**
- [ ] Drizzle schema + migrations: `companies`, `jobs`, `matches`, `tasks`
      (multi-user-ready per DESIGN.md §4).
- [ ] Durable Postgres queue (`SELECT … FOR UPDATE SKIP LOCKED`, 120s lease,
      exponential backoff, dead-letter after 4 tries) — DESIGN.md §5.1.
- [ ] Connectors (config-driven, one adapter each): **Greenhouse, Lever, Ashby** —
      cover all 11 default companies. Normalize to the common `Job` shape.
- [ ] Eligibility gate (eligible / longshot / blocked) from config regions +
      `blockPhrases` + company footprint — DESIGN.md §5.3.
- [ ] Role/title gates from config (`roleKeywords`, `titleExclude`) — §5.4.
- [ ] Salary parser (LPA/lakh/crore/₹/$), display-only — §5.5.
- [ ] Scoring engine: additive model + **tier bonus**, all weights from config — §6.
- [ ] `/api/ingest` route + Vercel Cron entry (manual trigger for dev).
- [ ] Dedupe on re-ingest (stable job key); set `first_seen`.

**Acceptance:** run ingest against the default config → DB holds scored jobs, US-only
roles marked `blocked`, each job has a `score_reason`. Swap in a *different* config
(e.g. a Python backend dev, different companies) → results change accordingly, **no
code edits.**

---

## Phase 2 — Web dashboard (the Board)

**Goal:** the daily view the user actually opens.

**Tasks**
- [ ] Board page: jobs ranked by score, newest-fresh first.
- [ ] Each row: company + tier badge, title, location, freshness, salary (if parsed),
      score + expandable **why** (score reason).
- [ ] Filters: tier (e.g. "Product MNC only"), eligibility, "untracked only", search.
- [ ] Empty/loading/error states; responsive; light+dark.
- [ ] "Last refreshed" indicator + manual refresh button.

**Acceptance:** open the dashboard, see today's ranked matches, filter to Product MNCs,
expand a job to read why it scored what it did. Works from the shipped default config.

---

## Phase 3 — Tracker + Insights

**Goal:** manage the pipeline and learn what actually gets replies.

**Tasks**
- [ ] Save/apply flow: `matches.status` = new → saved → applied → rejected.
- [ ] Record applied date + first-reply date; auto-mark **ghosted** after 21 days.
- [ ] Tracker view (kanban or table by status).
- [ ] Insights: reply-rate funnel segmented by eligibility, posting age, remote, tier,
      company, board.

**Acceptance:** mark a job applied, see it move in the Tracker, and see reply-rate
segments populate in Insights.

---

## Phase 4 — Discovery + MNC reach

**Goal:** see beyond the curated list — especially the Workday MNCs.

**Tasks**
- [ ] Add **SmartRecruiters** + **Rippling** connectors (finish the ATS set).
- [ ] **Adzuna** connector (config-gated by `ADZUNA_*` env) for broad India discovery.
- [ ] Auto-tier unknown companies (curated tier lists + heuristics) so Adzuna results
      slot into the same tier filters.
- [ ] **Workday connector** — unlocks Mastercard / Deutsche Bank / most MNCs
      (DESIGN.md §11 finding: 3 of the named companies run Workday).
- [ ] Re-probe Razorpay / Meesho / PhonePe for valid tokens; add if found.

**Acceptance:** with Adzuna keys set, discovery jobs appear tagged with a tier; with
the Workday connector, at least one MNC (e.g. Mastercard) shows real roles.

---

## Phase 5 — Nudge + deploy

**Goal:** it comes to you, and anyone can ship it.

**Tasks**
- [ ] Morning digest: "🔔 N new matches today" → **Telegram** (bot token) and/or email,
      config-gated. Links back to the Board.
- [ ] GitHub Actions workflow for 6-hourly refresh (beats Vercel daily-cron limit).
- [ ] One-page **deploy guide**: Vercel + Neon/Supabase, env setup, cron.
- [ ] "Deploy to Vercel" button in README.

**Acceptance:** a fresh user follows the deploy guide and receives a morning digest
of their own matches within a day.

---

## Phase 6 — Edges (optional, post-MVP)

- [ ] **AI resume-match**: upload a résumé (PDF), LLM scores fit 0–100; swaps into the
      same score slot without changing the pipeline.
- [ ] **Multi-user**: Supabase Auth; per-user profile rows (schema already supports it).
- [ ] **Referral hints**: surface known connections at a company.

---

## Definition of done (MVP = Phases 0–3, + 5's deploy guide)

A person I share the repo with can:
1. Clone it,
2. Edit **`jobscout.config.ts`** with their skills, salary band, and target companies,
3. Set `DATABASE_URL` in `.env`,
4. Deploy to Vercel,
5. Open their dashboard the next morning to a ranked, filtered, personalized job list —

…**without editing any code.**

---

## Build order & suggested milestones

```
Phase 0  ──►  Phase 1  ──►  Phase 2  ──►  Phase 3
                   │
                   └──►  Phase 4        (parallel-able after Phase 1)
Phase 2  ──►  Phase 5
Phase 2  ──►  Phase 6  (optional)
```

- **Milestone A (engine):** Phases 0–1 — prove config → scored jobs.
- **Milestone B (usable MVP):** + Phases 2–3 — the daily portal you'd actually use.
- **Milestone C (shareable product):** + Phase 5 — anyone deploys their own.
- **Milestone D (reach + smarts):** + Phases 4/6 — MNCs, discovery, AI.

---

*Next action: start **Phase 0** — scaffold + the `jobscout.config.ts` contract.*
