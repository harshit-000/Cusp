"use client";

import { useMemo } from "react";
import { useJobs } from "@/hooks/useJobs";
import { StatusActions } from "./StatusActions";
import { TierBadge } from "./badges";
import { Loading, ErrorState, EmptyState } from "./States";
import { Card, CardContent } from "@/components/ui/card";
import type { JobRow } from "@/lib/data/types";

const GROUPS = [
  { key: "saved", title: "Saved" },
  { key: "applied", title: "Applied" },
  { key: "rejected", title: "Rejected" },
  { key: "ghosted", title: "Ghosted" },
];

export function Tracker() {
  const { data, isLoading, isError, error, refetch } = useJobs();
  const rows = data?.rows ?? [];

  const byStatus = useMemo(() => {
    const map: Record<string, JobRow[]> = {};
    for (const r of rows) {
      if (r.status !== "new") (map[r.status] ??= []).push(r);
    }
    return map;
  }, [rows]);

  const total = Object.values(byStatus).reduce((n, arr) => n + arr.length, 0);

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
        title="Tracking needs a database"
        hint="Set DATABASE_URL in .env and run npm run ingest, then Save or Apply to roles on the Board."
      />
    );
  if (total === 0)
    return (
      <EmptyState
        title="No tracked applications yet"
        hint="On the Board, Save roles or Mark applied to build your pipeline here."
      />
    );

  return (
    <div className="space-y-6">
      {GROUPS.map((g) => {
        const items = byStatus[g.key] ?? [];
        if (items.length === 0) return null;
        return (
          <section key={g.key}>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {g.title}
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                {items.length}
              </span>
            </h2>
            <div className="space-y-2">
              {items.map((r) => (
                <Card key={r.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium hover:text-primary"
                      >
                        {r.title}
                      </a>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{r.company}</span>
                        <TierBadge tier={r.tier} />
                        {r.firstReplyAt && <span className="font-medium text-success">· Replied</span>}
                      </div>
                    </div>
                    <StatusActions row={r} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
