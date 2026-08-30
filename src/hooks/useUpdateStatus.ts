"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { MatchAction } from "@/lib/data/mutations";

/** Mutation for tracker actions. Invalidates the jobs query so views refresh. */
export function useUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { jobId: string; action: MatchAction }) => {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(vars),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error ?? "Failed to update");
      return body;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }),
  });
}
