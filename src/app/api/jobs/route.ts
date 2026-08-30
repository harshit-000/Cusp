import { getStoredRows } from "@/lib/data/query";
import { getPreviewRows } from "@/lib/data/preview";
import { configState } from "@/config/load";
import type { JobsResponse } from "@/lib/data/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Serve ranked jobs. Uses the database when DATABASE_URL is set; otherwise falls
 * back to a live (unsaved) preview so the dashboard works before DB setup.
 * Filtering happens client-side, so this returns the full ranked set.
 */
export async function GET(): Promise<Response> {
  // Nothing is served until the app is configured.
  const cfg = configState();
  if (cfg.status !== "ok") {
    const body: JobsResponse = {
      mode: "db",
      rows: [],
      lastRefreshed: new Date().toISOString(),
      error: cfg.status === "not-set" ? "Cusp is not configured yet." : cfg.message,
    };
    return Response.json(body, { status: 503 });
  }

  const dbConnected = Boolean(process.env.DATABASE_URL);
  try {
    const rows = dbConnected ? await getStoredRows() : await getPreviewRows();
    const body: JobsResponse = {
      mode: dbConnected ? "db" : "preview",
      rows,
      lastRefreshed: new Date().toISOString(),
    };
    return Response.json(body);
  } catch (err) {
    const body: JobsResponse = {
      mode: dbConnected ? "db" : "preview",
      rows: [],
      lastRefreshed: new Date().toISOString(),
      error: err instanceof Error ? err.message : String(err),
    };
    return Response.json(body, { status: 500 });
  }
}
