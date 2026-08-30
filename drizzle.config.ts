import type { Config } from "drizzle-kit";

/**
 * Drizzle wiring. Table definitions land in Phase 1 (src/db/schema.ts).
 * `DATABASE_URL` comes from .env — never hardcode it.
 */
export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
} satisfies Config;
