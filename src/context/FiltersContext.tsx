"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DEFAULT_FILTERS, type Filters } from "@/lib/filters";

interface FiltersContextValue {
  filters: Filters;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  reset: () => void;
}

const FiltersContext = createContext<FiltersContextValue | null>(null);

/** Holds the Board's filter state. Kept in context so the FilterBar and the list
 *  stay decoupled — neither owns the other's state. */
export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const setFilter = useCallback(
    <K extends keyof Filters>(key: K, value: Filters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const reset = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const value = useMemo(() => ({ filters, setFilter, reset }), [filters, setFilter, reset]);
  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters(): FiltersContextValue {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters must be used within <FiltersProvider>");
  return ctx;
}
