import { sql } from "drizzle-orm";
import type { Db } from "@/db";

/**
 * Durable Postgres work queue (DESIGN.md §5.1). One task per company board.
 * Atomic claim via FOR UPDATE SKIP LOCKED + a lease, so concurrent workers never
 * grab the same row and a dead worker's task is auto-reclaimed when its lease
 * expires — no janitor process needed.
 */

const LEASE_SECONDS = 120;
const MAX_ATTEMPTS = 4;

export interface ClaimedTask {
  id: string;
  companyId: string;
  etag: string | null;
  attempts: number;
}

export async function claimTask(db: Db): Promise<ClaimedTask | null> {
  const rows = (await db.execute(sql`
    UPDATE tasks SET
      state = 'running',
      attempts = attempts + 1,
      lease_until = now() + (${LEASE_SECONDS} * interval '1 second'),
      updated_at = now()
    WHERE id = (
      SELECT id FROM tasks
      WHERE (state IN ('queued', 'failed') AND run_after <= now())
         OR (state = 'running' AND lease_until < now())
      ORDER BY run_after ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING id, company_id, etag, attempts;
  `)) as unknown as Array<Record<string, unknown>>;

  const r = rows[0];
  if (!r) return null;
  return {
    id: String(r.id),
    companyId: String(r.company_id),
    etag: (r.etag as string | null) ?? null,
    attempts: Number(r.attempts),
  };
}

export async function completeTask(
  db: Db,
  id: string,
  etag?: string | null,
): Promise<void> {
  await db.execute(sql`
    UPDATE tasks SET
      state = 'done',
      lease_until = null,
      last_error = null,
      etag = ${etag ?? null},
      updated_at = now()
    WHERE id = ${id};
  `);
}

/** Mark failed with exponential backoff; dead-letter after MAX_ATTEMPTS. */
export async function failTask(
  db: Db,
  id: string,
  attempts: number,
  message: string,
  retryAfterSec?: number,
): Promise<{ dead: boolean; delaySec: number }> {
  const dead = attempts >= MAX_ATTEMPTS;
  const backoff = Math.min(20 * 2 ** Math.max(0, attempts - 1), 1800);
  const jitter = retryAfterSec ? 0 : Math.random() * backoff * 0.2;
  const delaySec = Math.round(retryAfterSec ?? backoff + jitter);

  await db.execute(sql`
    UPDATE tasks SET
      state = ${dead ? "dead" : "failed"},
      run_after = now() + (${delaySec} * interval '1 second'),
      lease_until = null,
      last_error = ${message.slice(0, 500)},
      updated_at = now()
    WHERE id = ${id};
  `);
  return { dead, delaySec };
}
