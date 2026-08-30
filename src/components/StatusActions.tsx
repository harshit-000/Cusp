"use client";

import { Bookmark, Check, X, RotateCcw, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdateStatus } from "@/hooks/useUpdateStatus";
import type { JobRow } from "@/lib/data/types";
import type { MatchAction } from "@/lib/data/mutations";

/** Tracker action buttons for a job, driven by its current status. */
export function StatusActions({ row }: { row: JobRow }) {
  const mutation = useUpdateStatus();
  const busy = mutation.isPending;
  const act = (action: MatchAction) => mutation.mutate({ jobId: row.id, action });
  const s = row.status;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {(s === "new" || s === "saved") && (
        <>
          <Button
            variant={s === "saved" ? "secondary" : "outline"}
            size="sm"
            disabled={busy}
            onClick={() => act(s === "saved" ? "reset" : "save")}
          >
            <Bookmark className="h-3.5 w-3.5" />
            {s === "saved" ? "Saved" : "Save"}
          </Button>
          <Button variant="default" size="sm" disabled={busy} onClick={() => act("apply")}>
            <Check className="h-3.5 w-3.5" />
            Mark applied
          </Button>
        </>
      )}

      {s === "applied" && (
        <>
          {row.firstReplyAt ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
              <MailCheck className="h-3.5 w-3.5" />
              Replied
            </span>
          ) : (
            <Button variant="outline" size="sm" disabled={busy} onClick={() => act("reply")}>
              <MailCheck className="h-3.5 w-3.5" />
              Got reply
            </Button>
          )}
          <Button variant="outline" size="sm" disabled={busy} onClick={() => act("reject")}>
            <X className="h-3.5 w-3.5" />
            Rejected
          </Button>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => act("reset")}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </>
      )}

      {(s === "rejected" || s === "ghosted") && (
        <Button variant="ghost" size="sm" disabled={busy} onClick={() => act("reset")}>
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
      )}
    </div>
  );
}
