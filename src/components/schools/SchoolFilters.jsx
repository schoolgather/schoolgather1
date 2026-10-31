import React from "react";
import { Search, SlidersHorizontal, LocateFixed, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CURRICULA } from "@/lib/constants";
import { formatMoney } from "@/lib/geo";

const SORTS = [
  { value: "recommended", label: "Recommended" },
  { value: "distance", label: "Closest first" },
  { value: "tuition_low", label: "Lowest tuition" },
  { value: "tuition_high", label: "Highest tuition" },
  { value: "rating", label: "Top rated" },
];

export default function SchoolFilters({
  filters,
  onChange,
  onUseLocation,
  locating,
  hasLocation,
  onClearLocation,
  resultCount,
}) {
  const set = (patch) => onChange({ ...filters, ...patch });

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Search by school name, city or programme"
            className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Curriculum</span>
            <select
              value={filters.curriculum}
              onChange={(e) => set({ curriculum: e.target.value })}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="Any">Any curriculum</option>
              {CURRICULA.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Max annual tuition · {filters.maxTuition ? formatMoney(filters.maxTuition) : "No limit"}
            </span>
            <input
              type="range"
              min={2000}
              max={45000}
              step={500}
              value={filters.maxTuition || 45000}
              onChange={(e) => set({ maxTuition: Number(e.target.value) >= 45000 ? 0 : Number(e.target.value) })}
              className="h-10 w-full accent-[hsl(var(--primary))]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Radius · {hasLocation ? `${filters.radiusKm} km` : "set location"}
            </span>
            <div className="flex gap-2">
              <input
                type="range"
                min={5}
                max={200}
                step={5}
                value={filters.radiusKm}
                disabled={!hasLocation}
                onChange={(e) => set({ radiusKm: Number(e.target.value) })}
                className="h-10 w-full accent-[hsl(var(--primary))] disabled:opacity-40"
              />
              <Button
                type="button"
                size="icon"
                variant={hasLocation ? "secondary" : "outline"}
                onClick={hasLocation ? onClearLocation : onUseLocation}
                disabled={locating}
                title={hasLocation ? "Clear location" : "Use my location"}
                className="h-10 w-10 shrink-0"
              >
                {hasLocation ? <X className="h-4 w-4" /> : <LocateFixed className="h-4 w-4" />}
              </Button>
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Sort by</span>
            <select
              value={filters.sort}
              onChange={(e) => set({ sort: e.target.value })}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={filters.scholarshipsOnly}
              onCheckedChange={(v) => set({ scholarshipsOnly: v })}
            />
            Schools with scholarships
          </label>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" /> {resultCount} school{resultCount === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={() =>
                onChange({
                  q: "",
                  curriculum: "Any",
                  maxTuition: 0,
                  radiusKm: 25,
                  sort: "recommended",
                  scholarshipsOnly: false,
                })
              }
              className="font-medium text-primary hover:underline"
            >
              Reset filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}