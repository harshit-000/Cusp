/**
 * Force a full re-fetch + re-score of every job (clears ETags first). Run after
 * changing scoring config/weights in jobscout.config.ts:  npm run rescore
 */
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { runIngest } from "@/lib/ingest/run";

(async () => {
  const db = getDb();
  await db.execute(sql`UPDATE tasks SET etag = NULL`);
  console.log("Cleared ETags — re-fetching and re-scoring all boards…");
  const stats = await runIngest({ force: true, timeBudgetMs: 120_000 });
  console.log("✅ Re-score complete:", stats);
  process.exit(0);
})().catch((err) => {
  console.error("❌ Re-score failed:", err);
  process.exit(1);
});
