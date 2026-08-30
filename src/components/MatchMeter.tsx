/** Circular résumé-fit meter. Color shifts with the match strength. */
export function MatchMeter({ score }: { score: number }) {
  const color =
    score >= 70
      ? "hsl(var(--success))"
      : score >= 45
        ? "hsl(var(--warning))"
        : "hsl(var(--muted-foreground))";

  const r = 18;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);

  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 44 44" className="h-14 w-14 -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center text-sm font-semibold"
        style={{ color }}
      >
        {score}
      </div>
    </div>
  );
}
