/**
 * Apply Drizzle migrations. Run via `npm run db:migrate` (loads .env).
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL is not set. Add it to .env first.");
  process.exit(1);
}

const client = postgres(url, { max: 1 });
const db = drizzle(client);

migrate(db, { migrationsFolder: "./drizzle" })
  .then(async () => {
    console.log("✅ Migrations applied.");
    await client.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("❌ Migration failed:", err);
    await client.end();
    process.exit(1);
  });
