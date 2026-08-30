import { getFetchingEnabled, setFetchingEnabled } from "@/lib/data/settings";

export const dynamic = "force-dynamic";

/** Read app settings (currently: whether fetching is enabled). */
export async function GET(): Promise<Response> {
  if (!process.env.DATABASE_URL) {
    return Response.json({ fetchingEnabled: true, persistent: false });
  }
  try {
    return Response.json({ fetchingEnabled: await getFetchingEnabled(), persistent: true });
  } catch (err) {
    return Response.json(
      { fetchingEnabled: true, persistent: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

/** Toggle fetching on/off. */
export async function POST(req: Request): Promise<Response> {
  if (!process.env.DATABASE_URL) {
    return Response.json({ ok: false, error: "Connect a database to change this." }, { status: 400 });
  }
  try {
    const { fetchingEnabled } = (await req.json()) as { fetchingEnabled?: boolean };
    if (typeof fetchingEnabled !== "boolean") {
      return Response.json({ ok: false, error: "fetchingEnabled must be a boolean." }, { status: 400 });
    }
    await setFetchingEnabled(fetchingEnabled);
    return Response.json({ ok: true, fetchingEnabled });
  } catch (err) {
    return Response.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
