"use client";

import { useMemo } from "react";
import { useJobs } from "@/hooks/useJobs";
import { buildInsights, type Segment } from "@/lib/insights";
import { Loading, ErrorState, EmptyState } from "./States";
import { Card, CardContent } from "@/components/ui/card";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="font-serif text-2xl font-semibold">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function SegBar({ seg }: { seg: Segment }) {
  const rate = seg.applied ? Math.round((100 * seg.replied) / seg.applied) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{seg.label}</span>
        <span className="text-muted-foreground">
          {seg.replied}/{seg.applied} · {rate}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${rate}%` }} />
      </div>
    </div>
  );
}

export function Insights() {
  const { data, isLoading, isError, error, refetch } = useJobs();
  const rows = data?.rows ?? [];
  const ins = useMemo(() => buildInsights(rows), [rows]);

  if (isLoading) return <Loading />;
  if (isError)
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Something went wrong."}
        onRetry={() => refetch()}
      />
    );
  if (data?.mode === "preview")
    return (
      <EmptyState
        title="Insights need a database"
        hint="Set DATABASE_URL and run npm run ingest, then track applications to build your funnel."
      />
    );
  if (ins.applied === 0)
    return (
      <EmptyState
        title="No applications tracked yet"
        hint="Mark roles as applied on the Board or Tracker — reply-rate insights will build here."
      />
    );

  const rate = ins.replyRate == null ? "—" : `${Math.round(ins.replyRate * 100)}%`;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Saved" value={ins.saved} />
        <Stat label="Applied" value={ins.applied} />
        <Stat label="Replies" value={ins.replied} />
        <Stat label="Reply rate" value={rate} />
      </div>

      {ins.byTier.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Reply rate by tier
          </h2>
          <div className="space-y-3">
            {ins.byTier.map((s) => (
              <SegBar key={s.key} seg={s} />
            ))}
          </div>
        </section>
      )}

      {ins.byEligibility.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Reply rate by eligibility
          </h2>
          <div className="space-y-3">
            {ins.byEligibility.map((s) => (
              <SegBar key={s.key} seg={s} />
            ))}
          </div>
        </section>
      )}

      <p className="text-xs text-muted-foreground">
        Ghosted: {ins.ghosted} · Rejected: {ins.rejected}
      </p>
    </div>
  );
}
