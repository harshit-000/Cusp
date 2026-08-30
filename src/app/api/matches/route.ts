import { applyMatchAction, MATCH_ACTIONS, type MatchAction } from "@/lib/data/mutations";

export const dynamic = "force-dynamic";

/** Update a match's tracking status (save/apply/reject/reset/reply). */
export async function POST(req: Request): Promise<Response> {
  if (!process.env.DATABASE_URL) {
    return Response.json(
      { ok: false, error: "Connect a database to track applications." },
      { status: 400 },
    );
  }
  try {
    const { jobId, action } = (await req.json()) as { jobId?: string; action?: MatchAction };
    if (typeof jobId !== "string" || !action || !MATCH_ACTIONS.includes(action)) {
      return Response.json({ ok: false, error: "Invalid jobId or action." }, { status: 400 });
    }
    await applyMatchAction(jobId, action);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
