import { useEffect } from "react";

import type { CapturedImagePayload } from "@/features/inspection-capture";
import type { AnalysisResult, InspectionDecisionSource } from "@/entities/inspection";

export function useImmediateAnalysis(
  isPending: boolean,
  capturedInput: CapturedImagePayload | null,
  inspectionDecisionSource: InspectionDecisionSource | null,
  result: AnalysisResult | null,
  isReady: boolean,
  handleAnalyze: () => void | Promise<void>,
  clearPending: () => void,
) {
  useEffect(() => {
    if (!isPending || !capturedInput) return;

    if (inspectionDecisionSource === "protocol_pre_scan" || result) {
      clearPending();
      return;
    }

    if (!isReady) return;

    clearPending();
    void handleAnalyze();
  }, [
    capturedInput,
    clearPending,
    handleAnalyze,
    inspectionDecisionSource,
    isPending,
    isReady,
    result,
  ]);
}
