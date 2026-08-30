"use client";

import { Search } from "lucide-react";
import { useFilters } from "@/context/FiltersContext";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { EligibilityFilter } from "@/lib/filters";

/** Filter controls. Reads/writes filter state via context; owns no data. */
export function FilterBar() {
  const { filters, setFilter } = useFilters();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.q}
          onChange={(e) => setFilter("q", e.target.value)}
          placeholder="Search title or company…"
          className="pl-9"
        />
      </div>

      <Select value={filters.tier} onValueChange={(v) => setFilter("tier", v)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All tiers</SelectItem>
          <SelectItem value="product_mnc">Product MNC</SelectItem>
          <SelectItem value="big_startup">Big Startup</SelectItem>
          <SelectItem value="small_startup">Small Startup</SelectItem>
          <SelectItem value="service">Service</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.eligibility}
        onValueChange={(v) => setFilter("eligibility", v as EligibilityFilter)}
      >
        <SelectTrigger className="w-[175px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Eligible + Longshot</SelectItem>
          <SelectItem value="eligible">Eligible only</SelectItem>
          <SelectItem value="all">Include blocked</SelectItem>
        </SelectContent>
      </Select>

      <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-muted-foreground">
        <Checkbox
          checked={filters.untrackedOnly}
          onCheckedChange={(v) => setFilter("untrackedOnly", v === true)}
        />
        Untracked only
      </label>
    </div>
  );
}
