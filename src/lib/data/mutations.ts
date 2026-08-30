import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { matches } from "@/db/schema";
import { SELF_USER_ID } from "@/lib/constants";

export type MatchAction = "save" | "apply" | "reject" | "reset" | "reply";

export const MATCH_ACTIONS: MatchAction[] = ["save", "apply", "reject", "reset", "reply"];

/** Apply a tracker action to a match, updating status + relevant timestamps. */
export async function applyMatchAction(jobId: string, action: MatchAction): Promise<void> {
  const db = getDb();
  const now = new Date();
  const set: Record<string, unknown> = { updatedAt: now };

  switch (action) {
    case "save":
      set.status = "saved";
      break;
    case "apply":
      set.status = "applied";
      set.appliedAt = now;
      break;
    case "reject":
      set.status = "rejected";
      break;
    case "reset":
      set.status = "new";
      set.appliedAt = null;
      set.firstReplyAt = null;
      break;
    case "reply":
      set.firstReplyAt = now; // status stays "applied"
      break;
  }

  await db
    .update(matches)
    .set(set)
    .where(and(eq(matches.userId, SELF_USER_ID), eq(matches.jobId, jobId)));
}
