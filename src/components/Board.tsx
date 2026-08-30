"use client";

import { useMemo } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { PauseCircle } from "lucide-react";
import { useJobs } from "@/hooks/useJobs";
import { useSettings } from "@/hooks/useSettings";
import { useFilters } from "@/context/FiltersContext";
import { applyFilters } from "@/lib/filters";
import { FilterBar } from "./FilterBar";
import { JobCard } from "./JobCard";
import { Loading, ErrorState, EmptyState } from "./States";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Orchestrates data (useJobs) + filter state (useFilters) + presentation. */
export function Board() {
  const { data, isLoading, isError, error, refetch, isFetching } = useJobs();
  const { data: settings } = useSettings();
  const { filters } = useFilters();

  const rows = data?.rows ?? [];
  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);

  return (
    <section className="space-y-4">
      {settings?.persistent && settings.fetchingEnabled === false && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3.5 py-2.5 text-sm">
          <PauseCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Fetching is paused.</span> New jobs won&apos;t
            be pulled until you resume it (toggle in the top bar).
          </p>
        </div>
      )}

      {data?.mode === "preview" && (
        <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3.5 py-2.5 text-sm">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Live preview</span> — fresh results, not
            saved. Connect a database and run{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run ingest</code> to persist
            &amp; track.
          </p>
        </div>
      )}

      <FilterBar />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "role" : "roles"}
          {rows.length !== filtered.length && ` of ${rows.length}`}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          {isFetching ? "Refreshing" : "Refresh"}
        </Button>
      </div>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : "Something went wrong."}
          onRetry={() => refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={rows.length === 0 ? "No roles found yet" : "No roles match your filters"}
          hint={
            rows.length === 0
              ? "Try Refresh, or widen your matching rules in jobscout.config.ts."
              : "Loosen the filters above to see more."
          }
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((row) => (
            <JobCard key={row.id} row={row} />
          ))}
        </div>
      )}
    </section>
  );
}
