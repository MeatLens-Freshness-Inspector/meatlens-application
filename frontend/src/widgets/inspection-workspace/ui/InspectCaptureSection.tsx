import { CameraCapture, type CapturedImagePayload } from "@/features/inspection-capture";
import { Label } from "@/shared/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Loader2, TestTube2 } from "lucide-react";
import type { InspectionCaptureMode } from "../model/types";
import { InspectCaptureModeSection } from "./InspectCaptureModeSection";

type InspectCaptureSectionProps = {
  selectedLocation: string;
  mode?: InspectionCaptureMode;
  locationDisplayLabel: string;
  coordinateStatusText: string | null;
  marketLocations: string[];
  isPreScanChecklistComplete: boolean;
  isLocationSelectionDisabled: boolean;
  isCaptureDisabled: boolean;
  isCaptureCommitted: boolean;
  isAnalyzeBlockedByModel: boolean;
  isAnalyzing: boolean;
  isAnalysisPending: boolean;
  isDebugFileUploadEnabled: boolean;
  isInAppCameraEnabled: boolean;
  showModelInputPreview: boolean;
  showCaptureGuide?: boolean;
  skipQualityChecks?: boolean;
  disableRoiSegmentation: boolean;
  captureResetKey: number;
  onModeChange?: (mode: InspectionCaptureMode) => void;
  onSelectedLocationChange: (value: string) => void;
  onCapture: (capture: CapturedImagePayload) => void;
};

export function InspectCaptureSection({
  selectedLocation,
  mode = "analyze",
  locationDisplayLabel,
  coordinateStatusText,
  marketLocations,
  isPreScanChecklistComplete,
  isLocationSelectionDisabled,
  isCaptureDisabled,
  isCaptureCommitted,
  isAnalyzeBlockedByModel,
  isAnalyzing,
  isAnalysisPending,
  isDebugFileUploadEnabled,
  isInAppCameraEnabled,
  showModelInputPreview,
  showCaptureGuide = true,
  skipQualityChecks = false,
  disableRoiSegmentation,
  captureResetKey,
  onModeChange,
  onSelectedLocationChange,
  onCapture,
}: InspectCaptureSectionProps) {
  return (
    <section className="min-w-0 rounded-3xl border border-border/70 bg-card/92 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-display uppercase tracking-wider text-muted-foreground">
        <TestTube2 className="h-4 w-4" />
        Capture Station
      </div>

      <div className="mb-4 space-y-1">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">
          Change location
        </Label>
        <Select
          value={selectedLocation}
          onValueChange={onSelectedLocationChange}
          disabled={isLocationSelectionDisabled}
        >
          <SelectTrigger aria-label="Change location" className="h-10 rounded-xl bg-background/60">
            <SelectValue placeholder="Select market location" />
          </SelectTrigger>
          <SelectContent>
            {marketLocations.map((locationName) => (
              <SelectItem key={locationName} value={locationName}>
                {locationName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs font-medium text-foreground">
          Saved to report: {locationDisplayLabel || selectedLocation || "--"}
        </p>
        {coordinateStatusText && (
          <p className="text-[11px] text-muted-foreground">{coordinateStatusText}</p>
        )}
      </div>

      {mode === "analyze" && !isPreScanChecklistComplete && (
        <div className="mb-4 rounded-2xl border border-warning/30 bg-[hsl(var(--warning)/0.08)] px-4 py-3 text-xs text-foreground">
          Complete the required pre-scan checklist before opening the camera.
        </div>
      )}

      {onModeChange && (
        <InspectCaptureModeSection mode={mode} onModeChange={onModeChange} />
      )}

      <CameraCapture
        key={captureResetKey}
        onCapture={onCapture}
        disabled={isCaptureDisabled}
        allowFileUpload={isDebugFileUploadEnabled}
        allowInAppCamera={isInAppCameraEnabled}
        showModelInputPreview={showModelInputPreview}
        showCaptureGuide={showCaptureGuide && mode === "analyze"}
        skipQualityChecks={skipQualityChecks || mode === "photo-only"}
        disableRoiSegmentation={disableRoiSegmentation}
        showCaptureConfirmAction={!isCaptureCommitted}
        autoConfirmCapture
      />

      {isAnalysisPending && (
        <div
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-[hsl(var(--primary)/0.08)] px-4 py-3 text-sm font-medium text-foreground"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          {isAnalyzeBlockedByModel && !isAnalyzing
            ? "Getting the scan ready..."
            : "Analyzing sample..."}
        </div>
      )}
    </section>
  );
}
