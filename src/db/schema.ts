import {
  pgTable,
  text,
  integer,
  boolean,
  real,
  jsonb,
  timestamp,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

/**
 * Database schema (DESIGN.md §4). Jobs are global; per-user scoring/status lives
 * in `matches`, keyed by userId — so multi-user is a zero-rework addition later.
 * In Phase 1 there is exactly one implicit user (SELF_USER_ID).
 */

export const companies = pgTable("companies", {
  id: text("id").primaryKey(), // `${ats}:${token}`
  name: text("name").notNull(),
  tier: text("tier").notNull(),
  ats: text("ats").notNull(),
  token: text("token").notNull(),
  hiresIn: jsonb("hires_in").$type<string[]>(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const jobs = pgTable(
  "jobs",
  {
    id: text("id").primaryKey(), // stable hash of ats:token:externalId
    externalId: text("external_id").notNull(),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id),
    source: text("source").notNull(), // the ATS
    title: text("title").notNull(),
    location: text("location"),
    remote: boolean("remote").notNull().default(false),
    url: text("url").notNull(),
    salaryMin: real("salary_min"), // LPA when INR detected; else null
    salaryMax: real("salary_max"),
    salaryRaw: text("salary_raw"), // display string as found
    descriptionSnippet: text("description_snippet"),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    firstSeen: timestamp("first_seen", { withTimezone: true }).notNull().defaultNow(),
    lastSeen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index("jobs_company_idx").on(t.companyId),
    byPosted: index("jobs_posted_idx").on(t.postedAt),
  }),
);

export const matches = pgTable(
  "matches",
  {
    userId: text("user_id").notNull(),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id),
    score: integer("score").notNull(),
    scoreReason: text("score_reason").notNull(),
    matchedSkills: jsonb("matched_skills").$type<string[]>(),
    levelLabel: text("level_label"),
    eligibility: text("eligibility").notNull(), // eligible | longshot | blocked
    status: text("status").notNull().default("new"), // new|saved|applied|rejected|ghosted
    appliedAt: timestamp("applied_at", { withTimezone: true }),
    firstReplyAt: timestamp("first_reply_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.jobId] }),
    byScore: index("matches_score_idx").on(t.score),
  }),
);

/** Simple key-value app settings (e.g. whether job fetching is enabled). */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Durable ingestion queue — one task per company board refresh (DESIGN.md §5.1). */
export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(), // `refresh:${companyId}`
  companyId: text("company_id").notNull(),
  kind: text("kind").notNull().default("refresh_board"),
  state: text("state").notNull().default("queued"), // queued|running|failed|dead|done
  attempts: integer("attempts").notNull().default(0),
  runAfter: timestamp("run_after", { withTimezone: true }).notNull().defaultNow(),
  leaseUntil: timestamp("lease_until", { withTimezone: true }),
  etag: text("etag"),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
