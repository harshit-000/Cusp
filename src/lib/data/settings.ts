import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { settings } from "@/db/schema";

const FETCHING_KEY = "fetching_enabled";

/** Whether job fetching (ingest) is enabled. Defaults to true if never set. */
export async function getFetchingEnabled(): Promise<boolean> {
  const db = getDb();
  const rows = await db.select().from(settings).where(eq(settings.key, FETCHING_KEY)).limit(1);
  if (!rows.length) return true;
  return rows[0].value !== "false";
}

export async function setFetchingEnabled(enabled: boolean): Promise<void> {
  const db = getDb();
  await db
    .insert(settings)
    .values({ key: FETCHING_KEY, value: String(enabled) })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: String(enabled), updatedAt: new Date() },
    });
}
