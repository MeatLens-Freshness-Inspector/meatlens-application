import { Camera, ScanLine } from "lucide-react";
import { Button } from "@/shared/ui";
import type { InspectionCaptureMode } from "../model/types";

type InspectCaptureModeSectionProps = {
  mode: InspectionCaptureMode | null;
  onModeChange: (mode: InspectionCaptureMode) => void;
};

export function InspectCaptureModeSection({ mode, onModeChange }: InspectCaptureModeSectionProps) {
  const nextMode = mode === "photo-only" ? "analyze" : "photo-only";

  return (
    <div
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-[hsl(var(--primary)/0.06)] px-3 py-3"
      aria-label="Capture mode"
    >
      <div className="flex min-w-0 items-center gap-2">
        {mode === "photo-only" ? (
          <Camera className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        ) : (
          <ScanLine className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        )}
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Capture mode
          </p>
          <p className="truncate font-display text-sm font-semibold">
            {mode === "photo-only" ? "Take photo only" : "Analyze sample"}
          </p>
          <p className="text-xs text-muted-foreground">
            {mode === "photo-only" ? "Saves a photo without a result." : "Checks freshness after capture."}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        className="h-11 shrink-0 gap-2 rounded-xl px-3 text-sm"
        onClick={() => onModeChange(nextMode)}
        aria-label={nextMode === "photo-only" ? "Take photo only" : "Analyze sample"}
      >
        {nextMode === "photo-only" ? (
          <Camera className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ScanLine className="h-4 w-4" aria-hidden="true" />
        )}
        {nextMode === "photo-only" ? "Take photo only" : "Analyze sample"}
      </Button>
    </div>
  );
}
