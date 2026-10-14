import type { AnalysisResult, InspectionDecisionSource, InspectionInsert } from "./types";
import {
  EXPIRED_CERTIFICATE_REASON,
  PROTOCOL_SPOILED_REASON,
  buildProtocolSpoiledAnalysisResult,
  getRegulatoryCompliance,
  isCertificateExpired,
  toInspectionPreScanPayload,
  type InspectionPreScanForm,
} from "./pre-scan";

export interface InspectionSubmissionCoordinates {
  latitude: number;
  longitude: number;
}

export interface InspectionSubmissionInput {
  userId: string;
  submissionId: string;
  capturedAt: string;
  location: string | null;
  coordinates: InspectionSubmissionCoordinates | null;
  decisionSource: InspectionDecisionSource;
  preScanForm: InspectionPreScanForm;
  result: AnalysisResult;
  todayUtcDate?: string;
  imageUrl?: string | null;
}

export function buildInspectionInsert({
  userId,
  submissionId,
  capturedAt,
  location,
  coordinates,
  decisionSource,
  preScanForm,
  result,
  todayUtcDate,
  imageUrl = null,
}: InspectionSubmissionInput): InspectionInsert {
  const preScanPayload = toInspectionPreScanPayload(preScanForm);
  const certificateExpired = isCertificateExpired(
    preScanForm.meatExpiryDate,
    todayUtcDate,
  );
  const resolvedDecisionSource = certificateExpired
    ? "protocol_pre_scan"
    : decisionSource;
  const resolvedResult = certificateExpired
    ? buildProtocolSpoiledAnalysisResult(EXPIRED_CERTIFICATE_REASON)
    : result;
  const regulatoryCompliance = getRegulatoryCompliance(preScanForm, todayUtcDate);

  const modelVersionKey = result.model_version_key?.trim() || null;

  return {
    user_id: userId,
    client_submission_id: submissionId,
    meat_type: "pork",
    location: location?.trim() || null,
    location_latitude: coordinates?.latitude ?? null,
    location_longitude: coordinates?.longitude ?? null,
    ...preScanPayload,
    regulatory_compliance: regulatoryCompliance,
    inspection_decision_source: resolvedDecisionSource,
    protocol_spoiled_reason:
      resolvedDecisionSource === "protocol_pre_scan"
        ? certificateExpired
          ? EXPIRED_CERTIFICATE_REASON
          : PROTOCOL_SPOILED_REASON
        : null,
    captured_at: capturedAt,
    classification: resolvedResult.classification,
    confidence_score: resolvedResult.confidence_score,
    flagged_deviations: resolvedResult.flagged_deviations,
    explanation: resolvedResult.explanation,
    image_url: imageUrl,
    ...(!certificateExpired && modelVersionKey
      ? { model_version_key: modelVersionKey }
      : {}),
  };
}
