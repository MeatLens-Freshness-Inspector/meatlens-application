import { Camera, ScanLine } from "lucide-react";
import { Button } from "@/shared/ui";
import type { InspectionCaptureMode } from "../model/types";

type InspectCaptureModeSectionProps = {
  mode: InspectionCaptureMode | null;
  onModeChange: (mode: InspectionCaptureMode) => void;
};

export function InspectCaptureModeSection({ mode, onModeChange }: InspectCaptureModeSectionProps) {
  return (
    <section className="mt-4 rounded-3xl border border-primary/20 bg-card/95 p-4 shadow-sm" aria-labelledby="capture-mode-heading">
      <div className="mb-3">
        <h2 id="capture-mode-heading" className="font-display text-base font-semibold">
          What do you want to do?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Choose one. You can change this for each new capture.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant={mode === "analyze" ? "default" : "outline"}
          className="h-auto min-h-24 justify-start gap-3 rounded-2xl px-4 py-4 text-left"
          onClick={() => onModeChange("analyze")}
        >
          <ScanLine className="h-7 w-7 shrink-0" aria-hidden="true" />
          <span>
            <span className="block text-base font-semibold">Analyze sample</span>
            <span className="mt-1 block text-xs font-normal opacity-80">Check freshness and get a result.</span>
          </span>
        </Button>
        <Button
          type="button"
          variant={mode === "photo-only" ? "default" : "outline"}
          className="h-auto min-h-24 justify-start gap-3 rounded-2xl px-4 py-4 text-left"
          onClick={() => onModeChange("photo-only")}
        >
          <Camera className="h-7 w-7 shrink-0" aria-hidden="true" />
          <span>
            <span className="block text-base font-semibold">Take photo only</span>
            <span className="mt-1 block text-xs font-normal opacity-80">Save a stall photo. No result or analysis.</span>
          </span>
        </Button>
      </div>
    </section>
  );
}
