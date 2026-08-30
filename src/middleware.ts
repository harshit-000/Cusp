import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, authEnabled, sessionToken } from "@/lib/auth";

/** Password-gate all routes when auth is enabled. Open when it isn't. */
export async function middleware(req: NextRequest) {
  if (!authEnabled()) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // Always allow: the login page, the auth API, and the cron ingest endpoint
  // (which has its own CRON_SECRET check).
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/ingest") ||
    pathname === "/icon.svg" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  const expected = await sessionToken();
  if (cookie && cookie === expected) return NextResponse.next();

  if (pathname.startsWith("/api")) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
