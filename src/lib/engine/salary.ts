import type { ParsedSalary } from "@/lib/types";

/**
 * Best-effort salary parser. Display-only — it never feeds the score (DESIGN.md
 * §5.5), because most Indian postings omit pay and gating on it would hide the
 * best jobs. Handles INR LPA/lakh/crore and USD "$k" ranges.
 */

const COMP_CONTEXT = /(salary|compensation|ctc|package|pay|per annum|annual|base)/i;
const REJECT = /(per hour|\/hr|\/hour|hourly|per month|\/mo\b)/i;

export function parseSalary(
  description: string | null | undefined,
  explicit?: string,
): ParsedSalary | null {
  const trusted = Boolean(explicit && explicit.trim());
  const hay = `${explicit ?? ""} \n ${description ?? ""}`;
  if (!hay.trim()) return null;

  const contextOk = (idx?: number) =>
    (trusted || COMP_CONTEXT.test(hay)) && !REJECT.test(sliceAround(hay, idx));

  // Crore range/single: "₹1.2 - 1.5 Cr"
  const cr = hay.match(/(?:₹|inr|rs\.?)?\s*(\d+(?:\.\d+)?)\s*(?:-|to|–|—)?\s*(\d+(?:\.\d+)?)?\s*(cr|crores?)/i);
  if (cr && contextOk(cr.index)) {
    const a = parseFloat(cr[1]) * 100;
    const b = cr[2] ? parseFloat(cr[2]) * 100 : a;
    if (lpaOk(a) && lpaOk(b)) return { min: Math.min(a, b), max: Math.max(a, b), raw: cr[0].trim() };
  }

  // LPA/lakh range: "₹25L - 35L", "25 to 35 LPA"
  const range = hay.match(
    /(?:₹|inr|rs\.?)?\s*(\d{1,3}(?:\.\d+)?)\s*(?:l|lpa|lakhs?)?\s*(?:-|to|–|—)\s*(?:₹|inr|rs\.?)?\s*(\d{1,3}(?:\.\d+)?)\s*(l|lpa|lakhs?)/i,
  );
  if (range && contextOk(range.index)) {
    const min = parseFloat(range[1]);
    const max = parseFloat(range[2]);
    if (lpaOk(min) && lpaOk(max)) return { min, max, raw: range[0].trim() };
  }

  // LPA/lakh single: "18 LPA"
  const single = hay.match(/(?:₹|inr|rs\.?)?\s*(\d{1,3}(?:\.\d+)?)\s*(l|lpa|lakhs?)\b/i);
  if (single && contextOk(single.index)) {
    const v = parseFloat(single[1]);
    if (lpaOk(v)) return { min: v, max: v, raw: single[0].trim() };
  }

  // INR absolute: "₹30,00,000"
  const abs = hay.match(/(?:₹|inr|rs\.?)\s*([\d,]{6,})/i);
  if (abs) {
    const n = Number(abs[1].replace(/,/g, ""));
    if (n >= 100000) {
      const lpa = round1(n / 100000);
      return { min: lpa, max: lpa, raw: abs[0].trim() };
    }
  }

  // USD range: "$120k - $160k" — kept as raw only, no INR conversion.
  const usd = hay.match(/\$\s?(\d{2,3})k?\s*(?:-|to|–|—)\s*\$?\s?(\d{2,3})k/i);
  if (usd && contextOk(usd.index)) {
    return { min: null, max: null, raw: usd[0].trim() };
  }

  return null;
}

function lpaOk(n: number): boolean {
  return n >= 1 && n <= 300; // sane LPA bounds; filters out "5 years", team sizes, etc.
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function sliceAround(s: string, idx?: number): string {
  const i = idx ?? 0;
  return s.slice(Math.max(0, i - 24), i + 48);
}
