import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

let _db: Db | null = null;

/**
 * Lazily create the DB client. Kept lazy so the app boots (and static pages
 * build) without a database — only ingestion/dashboard queries need one.
 */
export function getDb(): Db {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and add your Postgres URL.",
    );
  }
  const client = postgres(url, { prepare: false });
  _db = drizzle(client, { schema });
  return _db;
}
