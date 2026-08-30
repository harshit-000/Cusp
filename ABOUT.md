# Cusp — Explained Simply

## What is it, in one line?

**A personal assistant that checks job boards every morning and shows you only the
jobs worth your time — ranked by how well they fit *your* résumé.**

Think of it like this: instead of you scrolling through hundreds of listings on
LinkedIn/Naukri, Cusp does the scrolling, throws away the junk, and hands you
a short, ranked shortlist.

---

## The problem it fixes

Job hunting has too much noise:
- Hundreds of listings, most irrelevant.
- Lots of "Software Engineer" jobs that are actually backend/QA/sales — not your thing.
- Jobs you can't even apply to (US-only, visa needed).
- By the time you find a good one, 800 people already applied.

Cusp cuts that noise down to **"here are today's ~10 roles that match you, freshest first."**

---

## How it works (3 simple steps)

```
   1. COLLECT              2. SCORE                 3. SHOW
   ┌──────────┐          ┌───────────┐          ┌───────────┐
   │ Reads job │   →     │ Ranks each │    →     │ You see a  │
   │ boards of │         │ job by fit │          │ clean list │
   │ companies │         │ to your CV │          │ every day  │
   └──────────┘          └───────────┘          └───────────┘
```

1. **Collect** — Every day it reads the careers pages of a list of companies and
   pulls in all their open jobs automatically.
2. **Score** — It compares each job to *you* and gives it a match score out of 100.
3. **Show** — It puts them in a simple dashboard, best matches on top.

---

## The three screens

| Screen | What it's for | In plain words |
|---|---|---|
| **Board** | Your daily shortlist | "What should I apply to today?" — ranked jobs with a match score. |
| **Tracker** | Your application pipeline | "What did I apply to, and what happened?" — Saved → Applied → Reply/Rejected. |
| **Insights** | Your stats | "What's actually working?" — how many replies you get, and from which kinds of jobs. |

---

## How the match score works (the important part)

The score is like a recruiter quickly screening your résumé. It asks, in order:

1. **Does the experience level fit me?**
   You have ~2 years. A "junior/mid" role fits great. A "Senior" or "Staff" role is a
   stretch, so it scores lower. A "Manager" role isn't for you at all.

2. **Do my skills match what the job wants?**
   It looks for *your* skills (React, TypeScript, Node, etc.) in the job. Lots of overlap
   = high score. A job that never mentions your skills = low score, even if the title
   says "Engineer."

3. **Is it the right kind of role?**
   Because you're a **frontend** engineer, frontend/fullstack jobs score full marks, and
   pure backend/infra jobs are pushed down.

4. **Can I actually apply?**
   India-based and open to you = full score. US-only/visa-locked = marked and pushed down.

5. **Is it fresh?**
   A job posted today beats one posted 3 months ago (you want to apply early).

All of this multiplies together into one number. **A job can't get a high score just by
being recent or having "Engineer" in the title — it has to genuinely fit you.** Every job
shows a "Why this match?" line so you can see the reasoning.

> ⚠️ **On purpose, salary is *not* used to score.** Most Indian job posts don't list pay,
> so scoring on it would hide great jobs. When a salary *is* mentioned, it's shown — but it
> never affects ranking.

---

## The one file that makes it "yours"

Everything personal lives in **one file: `jobscout.config.ts`**.

You (or anyone who copies this project) edits that one file to set:
- Your name, city, and target salary
- Your skills
- What job titles to include, and what to throw away (QA, sales, etc.)
- Which companies to watch

Change that file → the whole portal instantly works for a different person. **No coding
needed.** (Passwords/keys go in a separate `.env` file and are never shared.)

---

## Where do the jobs come from?

Companies post their jobs on hiring software (Greenhouse, Lever, Ashby). Those tools
publish the job list openly, so Cusp reads them directly — clean data, no scraping,
no rule-breaking. Right now it watches ~11 well-known product companies (Stripe, GitLab,
MongoDB, Postman, CRED, Groww, and more).

> Big companies like Mastercard use different software (Workday), so they're not connected
> yet — that's a planned upgrade.

---

## How to run it

```bash
npm run dev      # start it, then open http://localhost:3000
npm run ingest   # fetch the latest jobs into your database
```

That's it — open the Board and start applying.

---

## What's built, and what's next

**Built and working:**
- ✅ Collects jobs from companies automatically
- ✅ Scores them like a résumé screen (experience + skills + fit)
- ✅ Board, Tracker, and Insights screens
- ✅ Application tracking with auto "ghosted" after 21 days of silence
- ✅ A clean, warm dashboard that works on light and dark screens

**Coming next:**
- 🔜 Put it online (deploy) so it updates itself daily and you can open it anywhere
- 🔜 A morning "5 new matches today" ping (Telegram/email)
- 🔜 More job sources (broader search + big MNCs on Workday)

---

*In short: Cusp is your daily, personalized job shortlist — it reads the job market
for you, keeps only what fits your résumé, and helps you track every application.*
