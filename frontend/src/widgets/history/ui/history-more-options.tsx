import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button, ExportLoadingOverlay, Input } from "@/shared/ui";
import type { ExportProgress } from "@/shared/lib/use-export-task";
import type { FreshnessClassification } from "@/entities/inspection";
import type { HistoryMonthlyCount } from "../model/types";
import { HistorySidebar } from "./history-sidebar";

type HistoryMoreOptionsProps = {
  classificationCounts: Record<FreshnessClassification, number>;
  exportProgress: ExportProgress | null;
  formattedReportDayLabel: string | null;
  hasValidReportDay: boolean;
  isExportingDetailedPdf: boolean;
  monthlyCounts: HistoryMonthlyCount[];
  selectedDayAverageConfidence: number;
  selectedDayCount: number;
  selectedReportDay: string;
  totalInspections: number;
  onExportDetailedPdf: () => void;
  onReportDayChange: (value: string) => void;
};

export function HistoryMoreOptions({
  classificationCounts,
  exportProgress,
  formattedReportDayLabel,
  hasValidReportDay,
  isExportingDetailedPdf,
  monthlyCounts,
  selectedDayAverageConfidence,
  selectedDayCount,
  selectedReportDay,
  totalInspections,
  onExportDetailedPdf,
  onReportDayChange,
}: HistoryMoreOptionsProps) {
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  return (
    <section
      className="relative min-w-0 rounded-3xl border border-border/70 bg-card/92"
      aria-busy={isExportingDetailedPdf}
    >
      <ExportLoadingOverlay
        visible={isExportingDetailedPdf}
        message="Preparing PDF export..."
        progress={exportProgress}
      />
      <div className="space-y-4 p-4">
        <section aria-labelledby="history-report-heading" className="rounded-2xl border border-border/70 bg-background/50 p-4">
          <h2 id="history-report-heading" className="font-display text-base font-semibold">
            Export a report
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasValidReportDay
              ? `This report will include inspections from ${formattedReportDayLabel}.`
              : "Without a date, this includes all saved inspections."}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="space-y-1">
              <label
                htmlFor="inspection-day"
                className="text-sm font-medium"
              >
                Choose a date to export one day
              </label>
              <div className="flex gap-2">
                <Input
                  id="inspection-day"
                  type="date"
                  value={selectedReportDay}
                  onChange={(event) => onReportDayChange(event.target.value)}
                  className="h-11 rounded-lg bg-background/80"
                />
                {hasValidReportDay && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-11 rounded-lg px-3 text-xs"
                    onClick={() => onReportDayChange("")}
                  >
                    Clear date
                  </Button>
                )}
              </div>
            </div>
            <Button
              type="button"
              className="h-11 rounded-lg px-5"
              onClick={onExportDetailedPdf}
              disabled={isExportingDetailedPdf}
            >
              {isExportingDetailedPdf
                ? "Preparing PDF..."
                : hasValidReportDay
                  ? "Export this day as PDF"
                  : "Export all inspections as PDF"}
            </Button>
          </div>

          {hasValidReportDay && (
            <p className="mt-2 text-xs text-muted-foreground">
              {selectedDayCount} inspection{selectedDayCount === 1 ? "" : "s"} found for {formattedReportDayLabel}.
            </p>
          )}
        </section>

        <button
          type="button"
          className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/50 px-4 py-3 text-left"
          aria-controls="history-summary-controls"
          aria-expanded={isSummaryExpanded}
          onClick={() => setIsSummaryExpanded((expanded) => !expanded)}
        >
          <span className="flex min-w-0 flex-col">
            <span className="text-sm font-medium">
              {isSummaryExpanded ? "Hide totals and trends" : "Show totals and trends"}
            </span>
            <span className="text-xs text-muted-foreground">Classification and monthly activity</span>
          </span>
          {isSummaryExpanded ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </button>

        {isSummaryExpanded && (
          <section id="history-summary-controls" aria-labelledby="history-totals-heading">
            <h2 id="history-totals-heading" className="mb-3 font-display text-base font-semibold">
              Inspection totals
            </h2>
            <HistorySidebar
              classificationCounts={classificationCounts}
              hasValidReportDay={hasValidReportDay}
              monthlyCounts={monthlyCounts}
              selectedDayAverageConfidence={selectedDayAverageConfidence}
              selectedDayCount={selectedDayCount}
              totalInspections={totalInspections}
            />
          </section>
        )}
      </div>
    </section>
  );
}
