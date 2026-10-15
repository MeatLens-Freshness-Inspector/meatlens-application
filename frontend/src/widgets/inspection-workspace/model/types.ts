import type { CapturedImagePayload } from "@/features/inspection-capture";

export type InspectionCaptureMode = "analyze" | "photo-only";
import type { InspectionPreScanForm } from "@/entities/inspection";
import type {
  AnalysisResult,
  FreshnessClassification,
  InspectionDecisionSource,
} from "@/entities/inspection";

export type InspectionSaveStatus = "idle" | "saving" | "saved" | "queued";

export interface InspectPageViewModel {
  capturedInput: CapturedImagePayload | null;
  captureMode: InspectionCaptureMode;
  result: AnalysisResult | null;
  preScanForm: InspectionPreScanForm;
  marketLocations: string[];
  selectedLocation: string;
  locationDisplayLabel: string;
  coordinateStatusText: string | null;
  inspectionDecisionSource: InspectionDecisionSource | null;
  isAnalyzing: boolean;
  isAnalysisPending: boolean;
  isCaptureCommitted: boolean;
  isAnalyzeBlockedByModel: boolean;
  isCaptureDisabled: boolean;
  isCreateInspectionPending: boolean;
  isDebugFileUploadEnabled: boolean;
  isInAppCameraEnabled: boolean;
  isPreScanBypassed: boolean;
  isPreScanChecklistComplete: boolean;
  isLocationSelectionDisabled: boolean;
  isPhotoOnlyMode: boolean;
  saveStatus: InspectionSaveStatus;
  savedInspectionId: string | null;
  isSubmitDisputePending: boolean;
  isDisputeSubmitted: boolean;
  showDetailedResults: boolean;
  showModelInputPreview: boolean;
  disableRoiSegmentation: boolean;
  captureResetKey: number;
  showSaveActions: boolean;
  captureStatusText: string;
  analysisStatusText: string;
  confidenceText: string;
  confidenceSummaryClass: string;
  saveButtonLabel: string;
  resetButtonLabel: string;
  onCaptureModeChange: (mode: InspectionCaptureMode) => void;
  onPreScanFieldChange: (field: keyof InspectionPreScanForm, value: string) => void;
  onSelectedLocationChange: (value: string) => void;
  onCapture: (capture: CapturedImagePayload) => void;
  onReset: () => void;
  onSave: () => void;
  onSubmitDispute: (input: {
    expectedClassification: FreshnessClassification;
    reason: string;
  }) => void | Promise<void>;
}
