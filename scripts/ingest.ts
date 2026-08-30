/**
 * Run a full ingest cycle from the CLI (needs DATABASE_URL in .env).
 *   npm run ingest
 */
import { runIngest } from "@/lib/ingest/run";

// Manual CLI runs force a fetch even if the toggle is off.
runIngest({ timeBudgetMs: 120_000, force: true }).then(
  (stats) => {
    console.log("✅ Ingest complete:", stats);
    process.exit(0);
  },
  (err) => {
    console.error("❌ Ingest failed:", err);
    process.exit(1);
  },
);
