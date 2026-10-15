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
      <details>
        <summary className="cursor-pointer list-none px-4 py-4 font-display text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
          More options
        </summary>

        <div className="space-y-4 border-t border-border/70 px-4 pb-4 pt-4">
          <section className="rounded-2xl border border-border/70 bg-background/50 p-3">
            <h3 className="font-display text-sm font-semibold">Reports and date filter</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {hasValidReportDay
                ? `PDF will include inspections from ${formattedReportDayLabel}.`
                : "PDF will include all saved inspections. Choose a date to export one day."}
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="space-y-1">
                <label
                  htmlFor="inspection-day"
                  className="text-[10px] uppercase tracking-widest text-muted-foreground"
                >
                  Optional inspection day
                </label>
                <div className="flex gap-2">
                  <Input
                    id="inspection-day"
                    type="date"
                    value={selectedReportDay}
                    onChange={(event) => onReportDayChange(event.target.value)}
                    className="h-10 rounded-lg bg-background/80"
                  />
                  {hasValidReportDay && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 rounded-lg px-3 text-xs"
                      onClick={() => onReportDayChange("")}
                    >
                      Clear date
                    </Button>
                  )}
                </div>
              </div>
              <Button
                type="button"
                className="h-10 rounded-lg"
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
              <p className="mt-2 text-[11px] text-muted-foreground">
                {selectedDayCount} inspection{selectedDayCount === 1 ? "" : "s"} found for {formattedReportDayLabel}.
              </p>
            )}
          </section>

          <HistorySidebar
            classificationCounts={classificationCounts}
            hasValidReportDay={hasValidReportDay}
            monthlyCounts={monthlyCounts}
            selectedDayAverageConfidence={selectedDayAverageConfidence}
            selectedDayCount={selectedDayCount}
            totalInspections={totalInspections}
          />
        </div>
      </details>
    </section>
  );
}
