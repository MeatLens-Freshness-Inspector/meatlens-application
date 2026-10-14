import {
  EXPIRED_CERTIFICATE_REASON,
  buildProtocolSpoiledAnalysisResult,
  getInspectionDecisionSource,
  getRegulatoryCompliance,
  isCertificateExpired,
  PROTOCOL_SPOILED_REASON,
  toInspectionPreScanPayload,
  type AnalysisResult,
  type InspectionDecisionSource,
  type InspectionPreScanForm,
  type InspectionCoordinates,
} from "@/entities/inspection";
import type { CapturedImagePayload } from "@/features/inspection-capture";
import { queueScan, type PendingScan } from "@/features/offline-sync";
import { DEFAULT_MEAT_TYPE } from "./inspect-page";

export interface BuildPendingScanInput {
  submissionId: string;
  capture: CapturedImagePayload;
  queuedAt: string;
  userId: string;
  selectedLocation: string;
  inspectionDecisionSource: InspectionDecisionSource | null;
  isPreScanBypassed: boolean;
  preScanForm: InspectionPreScanForm;
  analysisResult?: AnalysisResult;
  todayUtcDate?: string;
  nextCoordinates?: InspectionCoordinates | null;
}

export async function buildPendingScan({
  submissionId,
  capture,
  queuedAt,
  userId,
  selectedLocation,
  inspectionDecisionSource,
  isPreScanBypassed,
  preScanForm,
  analysisResult,
  todayUtcDate,
  nextCoordinates,
}: BuildPendingScanInput): Promise<PendingScan> {
  const preScanPayload = toInspectionPreScanPayload(preScanForm);
  const certificateExpired = isCertificateExpired(
    preScanForm.meatExpiryDate,
    todayUtcDate,
  );
  const decisionSource =
    certificateExpired
      ? "protocol_pre_scan"
      : inspectionDecisionSource ??
        (isPreScanBypassed ? "ai" : getInspectionDecisionSource(preScanForm, todayUtcDate));
  const resolvedAnalysisResult = certificateExpired
    ? buildProtocolSpoiledAnalysisResult(EXPIRED_CERTIFICATE_REASON)
    : analysisResult;

  return {
    id: submissionId,
    imageData: await capture.file.arrayBuffer(),
    imageType: capture.file.type,
    imageName: capture.file.name,
    meatType: DEFAULT_MEAT_TYPE,
    location: selectedLocation.trim() || null,
    locationLatitude: nextCoordinates?.latitude ?? null,
    locationLongitude: nextCoordinates?.longitude ?? null,
    stallNumber: preScanPayload.stall_number ?? null,
    meatInspectionCertificateProof:
      preScanPayload.meat_inspection_certificate_proof ?? null,
    meatExpiryDate: preScanPayload.meat_expiry_date ?? null,
    storageCorrect: preScanPayload.storage_correct ?? null,
    lightColorCorrect: preScanPayload.light_color_correct ?? null,
    lightColorObserved: preScanPayload.light_color_observed ?? null,
    areaClean: preScanPayload.area_clean ?? null,
    regulatoryCompliance: getRegulatoryCompliance(preScanForm, todayUtcDate),
    inspectionDecisionSource: decisionSource,
    protocolSpoiledReason:
      decisionSource === "protocol_pre_scan"
        ? certificateExpired
          ? EXPIRED_CERTIFICATE_REASON
          : PROTOCOL_SPOILED_REASON
        : null,
    capturedAt: capture.capturedAt,
    queuedAt,
    userId,
    analysisResult: resolvedAnalysisResult,
    modelVersionKey: resolvedAnalysisResult?.model_version_key ?? null,
  };
}

export async function persistPendingScan(input: BuildPendingScanInput): Promise<void> {
  await queueScan(await buildPendingScan(input));
}
