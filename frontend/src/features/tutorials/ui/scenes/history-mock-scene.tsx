import React from "react";
import { ArrowLeft, ChevronDown, ClipboardList, Hash, MapPin } from "lucide-react";
import { tutorialFixtures } from "../../model/tutorial-fixtures";
import type { TutorialStepDefinition } from "../../model/inspection-tutorial";
import { MockHotspot } from "../mock-hotspot";
import { TutorialAppShell } from "../tutorial-app-shell";

interface HistoryMockSceneProps {
  step: TutorialStepDefinition;
  onAdvance: () => void;
}

export function HistoryMockScene({ step, onAdvance }: HistoryMockSceneProps) {
  const fixture = tutorialFixtures.history;
  const isList = step.id === "history-open-record" || step.id === "history-export-report";
  const isDetail = !isList;
  const isOpenRecord = step.id === "history-open-record";
  const isReviewDetails = step.id === "history-review-details";
  const isBack = step.id === "history-back-to-list";
  const isExport = step.id === "history-export-report";

  return (
    <TutorialAppShell
      activeTab="history"
      title={isDetail ? "Inspection details" : "History"}
      subtitle={isDetail ? "Saved result review" : "Saved inspections"}
    >
      {!isDetail ? (
        <div className="flex flex-col gap-2 p-3">
          <div className="rounded-2xl border border-border/70 bg-card/90 p-3">
            <p className="font-display text-[10px] font-semibold">Saved inspections</p>
            <div className="mt-2 space-y-1">
              <p className="text-[8px] uppercase tracking-widest text-muted-foreground">Find a saved record</p>
              <div className="rounded-xl border border-border/70 bg-background/70 px-2 py-2 text-[9px] text-muted-foreground">
                Search by meat or place
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-2 py-2">
              <div>
                <p className="text-[9px] font-semibold">Filter results</p>
                <p className="text-[8px] text-muted-foreground">All saved results</p>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            </div>
          </div>

          <MockHotspot active={isOpenRecord} onAdvance={onAdvance} label="Open record" ariaLabel={step.hotspotLabel}>
            <div className="rounded-2xl border border-border/70 bg-card/90 p-3">
              <div className="grid grid-cols-[auto_1fr_auto] gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-fresh/30 bg-fresh/14">
                  <ClipboardList className="h-4 w-4 text-fresh" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full border border-border/60 bg-background/70 px-1.5 py-0.5 text-[8px] uppercase tracking-widest text-muted-foreground">
                      Saved record
                    </span>
                    <span className="rounded-md border border-fresh/40 bg-fresh/20 px-1.5 py-0.5 text-[8px] font-semibold text-fresh">
                      Fresh
                    </span>
                  </div>
                  <p className="mt-1 truncate font-display text-[10px] font-semibold">{fixture.recordLabel}</p>
                  <p className="flex items-center gap-0.5 text-[8px] text-muted-foreground">
                    <MapPin className="h-2 w-2" />{fixture.locationLabel}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-sm font-bold text-fresh">{fixture.confidenceLabel}</p>
                  <p className="text-[7px] uppercase tracking-widest text-muted-foreground">confidence</p>
                  <p className="mt-1 text-[8px] font-semibold text-primary">Open record</p>
                </div>
              </div>
            </div>
          </MockHotspot>

          <section className="rounded-2xl border border-border/70 bg-card/90 p-3">
            <p className="font-display text-[10px] font-semibold">Documentation photos</p>
            <p className="mt-1 text-[8px] text-muted-foreground">Photos are hidden until requested.</p>
            <div className="mt-2 flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-2 py-2 text-[9px] font-semibold">
              <span>Show documentation photos</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-card/90 p-3">
            <p className="font-display text-[10px] font-semibold">Export a report</p>
            <p className="mt-1 text-[8px] leading-relaxed text-muted-foreground">
              Without a date, this includes all saved inspections.
            </p>
            <div className="mt-2 rounded-xl border border-border/70 bg-background/70 px-2 py-2 text-[9px] text-muted-foreground">
              Choose a date to export one day
            </div>
            <MockHotspot
              active={isExport}
              onAdvance={onAdvance}
              label="Export all inspections as PDF"
              ariaLabel={step.hotspotLabel}
            >
              <div className="flex h-8 items-center justify-center rounded-xl bg-primary px-2 text-[9px] font-semibold text-primary-foreground">
                Export all inspections as PDF
              </div>
            </MockHotspot>
          </section>

          <section className="rounded-2xl border border-border/70 bg-card/90 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-[10px] font-semibold">Show totals and trends</p>
                <p className="mt-1 text-[8px] text-muted-foreground">Classification and monthly activity</p>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            </div>
          </section>
        </div>
      ) : (
        <div className="flex flex-col gap-2 p-3">
          <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card/90 p-3">
            <MockHotspot active={isBack} onAdvance={onAdvance} label="Back" ariaLabel={step.hotspotLabel}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background/60">
                <ArrowLeft className="h-3.5 w-3.5" />
              </div>
            </MockHotspot>
            <div>
              <p className="font-display text-[10px] font-semibold">{fixture.recordLabel}</p>
              <p className="text-[8px] text-muted-foreground">{fixture.locationLabel}</p>
            </div>
          </div>

          <div data-tutorial-detail-summary className="rounded-2xl border border-border/70 bg-card/90 p-3">
            <div className="flex items-center justify-between">
              <p className="font-display text-[9px] uppercase tracking-wider text-muted-foreground">Result</p>
              <span className="rounded-md border border-fresh/40 bg-fresh/20 px-1.5 py-0.5 text-[8px] font-semibold text-fresh">
                {fixture.classification}
              </span>
            </div>
            <p className="mt-2 text-[9px] uppercase tracking-wider text-muted-foreground">Confidence</p>
            <div className="mt-1 flex items-center gap-1.5">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-[94%] rounded-full bg-fresh" />
              </div>
              <span className="font-display text-[10px] font-bold text-fresh">{fixture.confidenceLabel}</span>
            </div>
            <p className="mt-2 flex items-center gap-1 text-[8px] text-muted-foreground">
              <MapPin className="h-2.5 w-2.5" />{fixture.locationLabel}
            </p>
          </div>

          <div className="rounded-2xl border border-primary/25 bg-primary/5 p-3">
            <p className="font-display text-[9px] uppercase tracking-wider text-primary">Dispute result</p>
            <p className="mt-1 text-[8px] leading-relaxed text-muted-foreground">
              Use this when the saved result does not match your field evidence.
            </p>
          </div>

          <MockHotspot active={isReviewDetails} onAdvance={onAdvance} label="Review saved result" ariaLabel={step.hotspotLabel}>
            <div className="rounded-2xl border border-border/70 bg-card/90 p-3">
              <div className="flex items-center gap-1.5">
                <Hash className="h-2.5 w-2.5 text-muted-foreground" />
                <p className="font-display text-[9px] uppercase tracking-wider text-muted-foreground">Saved details</p>
              </div>
              <p className="mt-1.5 text-[9px] leading-relaxed text-muted-foreground">
                Review the stored explanation from this inspection.
              </p>
            </div>
          </MockHotspot>
        </div>
      )}
    </TutorialAppShell>
  );
}
