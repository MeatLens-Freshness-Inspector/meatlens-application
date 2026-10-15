import React from "react";
import { Button } from "@/shared/ui";
import { InspectionListItem } from "@/entities/inspection";
import { Loader2, ClipboardList, Search, ChevronLeft, ChevronRight } from "lucide-react";
import type { Inspection } from "@/entities/inspection";
import type { FilterOption } from "../model/types";
import { HISTORY_FILTER_OPTIONS } from "../model/history-page";

type InspectionTimelineSectionProps = {
  activeFilter: FilterOption;
  filteredCount: number;
  isLoading: boolean;
  pagedInspections: Inspection[];
  safePage: number;
  searchText: string;
  totalPages: number;
  onActiveFilterChange: (value: FilterOption) => void;
  onInspectionSelect: (inspection: Inspection) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onSearchTextChange: (value: string) => void;
};

export function InspectionTimelineSection({
  activeFilter,
  filteredCount,
  isLoading,
  pagedInspections,
  safePage,
  searchText,
  totalPages,
  onActiveFilterChange,
  onInspectionSelect,
  onNextPage,
  onPreviousPage,
  onSearchTextChange,
}: InspectionTimelineSectionProps) {
  return (
    <section className="min-w-0 rounded-3xl border border-border/70 bg-card/92 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-base font-semibold">Saved inspections</h2>
        <span className="rounded-full border border-border/70 bg-background/55 px-3 py-1 text-[11px] text-muted-foreground">
          {filteredCount} result{filteredCount === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-3 grid gap-2 rounded-2xl border border-border/70 bg-background/50 p-2 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,14rem)] sm:items-end">
        <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-2 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <label htmlFor="history-search" className="sr-only">
            Find a record by meat or place
          </label>
          <input
            id="history-search"
            value={searchText}
            onChange={(event) => onSearchTextChange(event.target.value)}
            placeholder="Find a record by meat or place"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="inspection-status"
            className="text-[10px] uppercase tracking-widest text-muted-foreground"
          >
            Show results
          </label>
          <select
            id="inspection-status"
            value={activeFilter}
            onChange={(event) => onActiveFilterChange(event.target.value as FilterOption)}
            className="h-10 w-full rounded-lg border border-border/70 bg-background/80 px-3 text-sm capitalize outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {HISTORY_FILTER_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredCount === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border/70 bg-background/55 py-16 text-muted-foreground">
            <ClipboardList className="mb-3 h-12 w-12" />
            <p className="font-display text-sm">No saved inspections found</p>
            <p className="mt-1 text-xs">Try another search or result status.</p>
          </div>
        ) : (
          <>
            {pagedInspections.map((inspection) => (
              <InspectionListItem
                key={inspection.id}
                inspection={inspection}
                onSelect={onInspectionSelect}
              />
            ))}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 rounded-xl"
                  onClick={onPreviousPage}
                  disabled={safePage === 1}
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {safePage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 rounded-xl"
                  onClick={onNextPage}
                  disabled={safePage === totalPages}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
