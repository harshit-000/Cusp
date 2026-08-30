/**
 * Minimal single-password gate for the deployed dashboard.
 *
 * Enabled only when BOTH APP_PASSWORD and AUTH_SECRET are set — so local dev
 * without them stays open. The session cookie holds an HMAC of a fixed string
 * keyed by AUTH_SECRET; without the secret it can't be forged. Uses Web Crypto,
 * which works in both the Node route handlers and the Edge middleware.
 */

export const AUTH_COOKIE = "js_auth";

export function authEnabled(): boolean {
  return Boolean(process.env.APP_PASSWORD && process.env.AUTH_SECRET);
}

export async function sessionToken(): Promise<string> {
  const secret = process.env.AUTH_SECRET ?? "";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("jobscout-session-v1"));
  return toHex(sig);
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
