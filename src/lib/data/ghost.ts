import { and, eq, isNull, lt } from "drizzle-orm";
import type { Db } from "@/db";
import { matches } from "@/db/schema";
import { GHOST_DAYS } from "@/lib/constants";

/** Flip applied-but-silent matches to "ghosted" after GHOST_DAYS. Run each ingest. */
export async function sweepGhosted(db: Db): Promise<void> {
  const cutoff = new Date(Date.now() - GHOST_DAYS * 86_400_000);
  await db
    .update(matches)
    .set({ status: "ghosted", updatedAt: new Date() })
    .where(
      and(
        eq(matches.status, "applied"),
        isNull(matches.firstReplyAt),
        lt(matches.appliedAt, cutoff),
      ),
    );
}
