export interface FetchResult<T> {
  data?: T;
  etag?: string;
  notModified: boolean;
}

/**
 * GET JSON with conditional-request (ETag) support. A 304 returns
 * `notModified: true` so callers can skip re-processing an unchanged board.
 */
export async function httpJson<T>(url: string, etag?: string): Promise<FetchResult<T>> {
  const headers: Record<string, string> = {
    "user-agent": "Cusp/0.1",
    accept: "application/json",
  };
  if (etag) headers["if-none-match"] = etag;

  const res = await fetch(url, { headers, cache: "no-store" });
  if (res.status === 304) return { notModified: true, etag };
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} — ${url}`);

  const newEtag = res.headers.get("etag") ?? undefined;
  const data = (await res.json()) as T;
  return { data, etag: newEtag, notModified: false };
}

/** Normalize a raw location string; junk placeholders become null (= unknown). */
export function cleanLocation(raw?: string | null): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  if (/^(n\/?a|na|tbd|none|-{1,}|unknown)$/i.test(s)) return null;
  return s;
}

/** Strip HTML tags + common entities to plain text (for description scanning). */
export function stripHtml(html?: string | null): string {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}
