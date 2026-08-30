import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { AUTH_COOKIE, authEnabled, sessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  if (!authEnabled()) return Response.json({ ok: true, note: "auth disabled" });

  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  const expected = process.env.APP_PASSWORD ?? "";

  if (typeof password !== "string" || !safeEqual(password, expected)) {
    return Response.json({ ok: false, error: "Incorrect password" }, { status: 401 });
  }

  const token = await sessionToken();
  const store = await cookies();
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // http on localhost, https in prod
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return Response.json({ ok: true });
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
