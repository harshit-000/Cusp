import type { NextRequest } from "next/server";
import { runIngest } from "@/lib/ingest/run";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel serverless cap (seconds)

/**
 * Ingestion endpoint, triggered by Vercel Cron (see vercel.json).
 * If CRON_SECRET is set, requires `Authorization: Bearer <secret>`.
 */
async function handle(req: NextRequest): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const stats = await runIngest({ timeBudgetMs: 55_000 });
    return Response.json({ ok: true, ...stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
