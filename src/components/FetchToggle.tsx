"use client";

import { useSettings, useToggleFetching } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";

/** A switch to pause/resume job fetching. Hidden when there's no database. */
export function FetchToggle() {
  const { data } = useSettings();
  const toggle = useToggleFetching();

  if (data && !data.persistent) return null; // no DB → nothing to persist
  const enabled = data?.fetchingEnabled ?? true;

  return (
    <button
      onClick={() => toggle.mutate(!enabled)}
      disabled={toggle.isPending}
      title={enabled ? "Fetching on — click to pause" : "Fetching paused — click to resume"}
      className="flex items-center gap-2 disabled:opacity-60"
    >
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          enabled ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-transform",
            enabled ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </span>
      <span className="hidden text-sm text-muted-foreground sm:inline">
        {enabled ? "Fetching on" : "Paused"}
      </span>
    </button>
  );
}
