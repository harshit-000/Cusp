"use client";

import { useQuery } from "@tanstack/react-query";
import type { JobsResponse } from "@/lib/data/types";

/** Fetches the ranked job set from /api/jobs (DB or live preview). */
export function useJobs() {
  return useQuery<JobsResponse>({
    queryKey: ["jobs"],
    queryFn: async () => {
      const res = await fetch("/api/jobs");
      const body = (await res.json()) as JobsResponse;
      if (!res.ok || body.error) {
        throw new Error(body.error ?? `Failed to load jobs (${res.status})`);
      }
      return body;
    },
  });
}
