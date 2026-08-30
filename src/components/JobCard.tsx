"use client";

import { useState } from "react";
import { MapPin, Clock, ExternalLink, ChevronDown, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatchMeter } from "./MatchMeter";
import { TierBadge, EligibilityBadge, StatusBadge } from "./badges";
import { StatusActions } from "./StatusActions";
import { postedAgo, freshness, formatSalary } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { JobRow } from "@/lib/data/types";

/** One job row. Only local logic is the expand toggle (small, so inline). */
export function JobCard({ row }: { row: JobRow }) {
  const [open, setOpen] = useState(false);
  const salary = formatSalary(row);
  const isFresh = freshness(row.postedAt) === "fresh";

  return (
    <Card className="animate-fade-in transition-shadow hover:shadow-md">
      <CardContent className="flex gap-4">
        <MatchMeter score={row.score} />

        <div className="min-w-0 flex-1">
          <a
            href={row.url}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-start gap-1.5 font-serif text-base font-medium leading-snug hover:text-primary"
          >
            {row.title}
            <ExternalLink className="mt-1 h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
          </a>

          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">{row.company}</span>
            <TierBadge tier={row.tier} />
            <EligibilityBadge value={row.eligibility} />
            <StatusBadge status={row.status} />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {row.location ?? (row.remote ? "Remote" : "—")}
            </span>
            <span className={cn("inline-flex items-center gap-1", isFresh && "font-medium text-success")}>
              <Clock className="h-3.5 w-3.5" />
              {postedAgo(row.postedAt)}
            </span>
            {salary && (
              <span className="inline-flex items-center gap-1 text-foreground">
                <Wallet className="h-3.5 w-3.5" />
                {salary}
              </span>
            )}
          </div>

          {row.matchedSkills.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {row.matchedSkills.slice(0, 7).map((s) => (
                <Badge key={s} variant="primary" className="font-normal">
                  {s}
                </Badge>
              ))}
            </div>
          )}

          <button
            onClick={() => setOpen((v) => !v)}
            className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            aria-expanded={open}
          >
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
            {open ? "Hide breakdown" : "Why this match?"}
          </button>
          {open && (
            <p className="mt-1.5 rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              {row.scoreReason}
            </p>
          )}

          <div className="mt-3 border-t pt-3">
            <StatusActions row={row} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
