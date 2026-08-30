# Cusp

A **config-driven, daily job-intelligence portal**. It pulls fresh roles from
company ATS boards, filters out what you can't apply to, ranks what's left by how
well it fits *you* and how fresh it is — and shows you the shortlist each morning.

Built for engineers switching from service/small-startup roles into **product MNCs
and well-known startups**. Not a job board — a personal filter over the firehose.

> **The whole promise:** edit **one file**, set your `.env`, deploy. No code changes.

---

## Make it yours in 5 minutes

1. **Clone & install**
   ```bash
   git clone <this-repo> && cd job-scout
   npm install
   ```

2. **Create your config** — copy the template, then edit it (this is the only
   file you touch; it's git-ignored so your details stay private):
   ```bash
   cp jobscout.config.example.ts jobscout.config.ts
   ```
   Change `profile.name` from `"Your Name"` to your real name (that's how the app
   knows it's configured), then set your skills, salary, locations, and companies.
   Until you do, the app shows a friendly "set up your config" screen.

3. **Add your secrets** — copy `.env.example` to `.env` and fill in `DATABASE_URL`
   (a free [Neon](https://neon.tech) or [Supabase](https://supabase.com) Postgres),
   and optionally `ADZUNA_*` keys for market-wide search. To password-protect a
   deployed dashboard, set `APP_PASSWORD` + `AUTH_SECRET` (leave blank for local).
   **Never put secrets in `jobscout.config.ts`.**

4. **Check & run**
   ```bash
   npm run config:check   # validates your config with friendly errors
   npm run dev            # open http://localhost:3000
   ```

That's it. If your config has a mistake, you'll get a plain-English message telling
you exactly which field to fix.

---

## Finding a company's ATS token

Each company in `jobscout.config.ts` needs an `ats` platform and a `token` (its
board slug). Look at the company's careers-page URL:

| If the careers URL looks like… | `ats` | `token` |
|---|---|---|
| `boards.greenhouse.io/postman` | `greenhouse` | `postman` |
| `jobs.lever.co/cred` | `lever` | `cred` |
| `jobs.ashbyhq.com/notion` | `ashby` | `notion` |

Companies on **Workday / SuccessFactors / their own portal** (many large MNCs like
Mastercard, Deutsche Bank) aren't reachable by the ATS connectors yet — those
arrive via the Adzuna + Workday connectors in Phase 4 (see `PLAN.md`).

---

## How it works

- **Ingestion** (daily cron): pull each company's board → normalize → dedupe →
  eligibility gate → role/title filters → tier tag → score → parse salary.
- **Scoring**: a transparent additive model (freshness, role/stack/seniority match,
  eligibility, tier) — every job shows *why* it scored what it did.
- **Dashboard**: ranked Board, application Tracker, reply-rate Insights.

Full architecture in [`DESIGN.md`](./DESIGN.md); the phased build plan in
[`PLAN.md`](./PLAN.md).

---

## Status

**Phase 0 complete** — foundation + the single-file config contract. The boot page
confirms your config loads. Phase 1 (real job ingestion) is next.
