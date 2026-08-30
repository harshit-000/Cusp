# Deploying Cusp (Vercel + Neon)

Cusp deploys free on **Vercel**, using your existing **Neon** Postgres and reading
your profile from an env var (so `jobscout.config.ts` stays private/local).

## Prerequisites
- The repo pushed to GitHub (`harshit-000/Cusp`).
- Your Neon `DATABASE_URL` (already set up and migrated).
- Adzuna keys (optional, for market discovery).
- A [Vercel](https://vercel.com) account (free Hobby tier is enough).

## 1. Grab your config as JSON
The deployed build has no `jobscout.config.ts` (it's git-ignored), so paste your
config as an env var. Generate it:

```bash
npm run -s config:json | pbcopy      # copies one line of JSON to your clipboard
```

## 2. Import the project into Vercel
- Vercel dashboard → **Add New… → Project** → import `harshit-000/Cusp`.
- Framework preset: **Next.js** (auto-detected). Leave build settings default.
- **Before deploying, add Environment Variables** (below), then deploy.

*(Or via CLI: `npm i -g vercel`, then `vercel` in the repo, then set env vars with
`vercel env add ...` and redeploy with `vercel --prod`.)*

## 3. Environment variables (set in Vercel → Settings → Environment Variables)

| Variable | Value | Purpose |
|---|---|---|
| `JOBSCOUT_CONFIG` | *(paste the JSON from step 1)* | Your profile/config |
| `DATABASE_URL` | your Neon connection string | Stored jobs & tracking |
| `ADZUNA_APP_ID` | your Adzuna app id | Market discovery (optional) |
| `ADZUNA_APP_KEY` | your Adzuna app key | Market discovery (optional) |
| `APP_PASSWORD` | a password you choose | Login gate |
| `AUTH_SECRET` | `openssl rand -hex 32` | Signs the session cookie |
| `CRON_SECRET` | `openssl rand -hex 32` | Authenticates the daily cron |

Set them for **Production** (and Preview if you want). Redeploy after adding.

## 4. That's it
- Open your Vercel URL → you'll hit the **login** page → enter `APP_PASSWORD` → dashboard.
- Because it shares your Neon DB, your existing jobs show up immediately.
- **Daily refresh**: `vercel.json` already schedules `/api/ingest` once a day
  (Vercel Hobby crons run daily). Vercel sends `CRON_SECRET` automatically.

## Notes & tips
- **Database is already migrated** — no migration step needed at deploy. (If you ever
  reset the DB: `npm run db:migrate`.)
- **Ingest time budget**: a serverless run is capped at 60s. Thanks to ETag caching a
  daily run is fast; if a very first run doesn't finish every board, the durable queue
  finishes it next run. You can always seed/refresh manually with `npm run ingest`.
- **Pause fetching**: the header toggle works in production (stored in the DB).
- **Change your profile later**: edit `jobscout.config.ts` locally, run
  `npm run -s config:json`, and update the `JOBSCOUT_CONFIG` env var on Vercel.
- **Re-score after tuning weights/matching**: run `npm run rescore` locally (writes to
  the same Neon DB the deployment reads).
