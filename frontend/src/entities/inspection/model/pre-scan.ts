import type {
  AnalysisResult,
  InspectionDecisionSource,
  InspectionInsert,
} from "@/entities/inspection";

export const PROTOCOL_SPOILED_REASON = "failed_pre_scan_safety_protocol";
export const EXPIRED_CERTIFICATE_REASON = "expired_meat_inspection_certificate";

export type InspectionPreScanChoice = "" | "yes" | "no";

export interface InspectionPreScanForm {
  stallNumber: string;
  meatInspectionCertificateProof: string;
  meatExpiryDate: string;
  storageCorrect: InspectionPreScanChoice;
  lightColorCorrect: InspectionPreScanChoice;
  lightColorObserved: string;
  areaClean: InspectionPreScanChoice;
}

function normalizeText(value: string): string {
  return value.trim();
}

function toBoolean(value: InspectionPreScanChoice): boolean | null {
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

function normalizeUtcDate(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;

  const [year, month, day] = normalized.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return normalized;
}

export function isCertificateExpired(
  meatExpiryDate: string | null | undefined,
  todayUtcDate = new Date().toISOString().slice(0, 10),
): boolean {
  const expiryDate = normalizeUtcDate(meatExpiryDate);
  const today = normalizeUtcDate(todayUtcDate);
  return expiryDate !== null && today !== null && expiryDate < today;
}

export function createEmptyPreScanForm(): InspectionPreScanForm {
  return {
    stallNumber: "",
    meatInspectionCertificateProof: "",
    meatExpiryDate: "",
    storageCorrect: "",
    lightColorCorrect: "",
    lightColorObserved: "",
    areaClean: "",
  };
}

export function isPreScanChecklistComplete(form: InspectionPreScanForm): boolean {
  if (!normalizeText(form.stallNumber)) return false;
  if (!normalizeText(form.meatInspectionCertificateProof)) return false;
  if (!normalizeText(form.meatExpiryDate)) return false;
  if (!form.storageCorrect) return false;
  if (!form.lightColorCorrect) return false;
  if (!form.areaClean) return false;

  if (form.lightColorCorrect === "no" && !normalizeText(form.lightColorObserved)) {
    return false;
  }

  return true;
}

function hasNonCertificateProtocolFailure(form: InspectionPreScanForm): boolean {
  return (
    form.storageCorrect === "no" ||
    form.lightColorCorrect === "no" ||
    form.areaClean === "no"
  );
}

export function hasProtocolFailure(
  form: InspectionPreScanForm,
  todayUtcDate?: string,
): boolean {
  return (
    isCertificateExpired(form.meatExpiryDate, todayUtcDate) ||
    hasNonCertificateProtocolFailure(form)
  );
}

export function getInspectionDecisionSource(
  form: InspectionPreScanForm,
  todayUtcDate?: string,
): InspectionDecisionSource {
  return hasProtocolFailure(form, todayUtcDate) ? "protocol_pre_scan" : "ai";
}

export function getProtocolSpoiledReason(
  form: InspectionPreScanForm,
  todayUtcDate?: string,
): string | null {
  if (isCertificateExpired(form.meatExpiryDate, todayUtcDate)) {
    return EXPIRED_CERTIFICATE_REASON;
  }

  return hasNonCertificateProtocolFailure(form) ? PROTOCOL_SPOILED_REASON : null;
}

export function getRegulatoryCompliance(
  form: InspectionPreScanForm,
  todayUtcDate?: string,
): boolean | null {
  const payload = toInspectionPreScanPayload(form);
  const hasPreScan = Object.values(payload).some((value) => value !== null);
  if (!hasPreScan) return null;
  if (isCertificateExpired(form.meatExpiryDate, todayUtcDate)) return false;

  return (
    payload.storage_correct === true &&
    payload.light_color_correct === true &&
    payload.area_clean === true
  );
}

export function buildProtocolSpoiledAnalysisResult(
  reason = PROTOCOL_SPOILED_REASON,
): AnalysisResult {
  const isExpiredCertificate = reason === EXPIRED_CERTIFICATE_REASON;
  return {
    classification: "spoiled",
    confidence_score: 100,
    flagged_deviations: [reason],
    explanation: isExpiredCertificate
      ? "Automatically classified as spoiled because the meat inspection certificate is expired. AI analysis was skipped."
      : "Automatically classified as spoiled due to failed pre-scan safety protocol. AI analysis was skipped.",
  };
}

export function toInspectionPreScanPayload(
  form: InspectionPreScanForm,
): Pick<
  InspectionInsert,
  | "stall_number"
  | "meat_inspection_certificate_proof"
  | "meat_expiry_date"
  | "storage_correct"
  | "light_color_correct"
  | "light_color_observed"
  | "area_clean"
> {
  return {
    stall_number: normalizeText(form.stallNumber) || null,
    meat_inspection_certificate_proof:
      normalizeText(form.meatInspectionCertificateProof) || null,
    meat_expiry_date: normalizeText(form.meatExpiryDate) || null,
    storage_correct: toBoolean(form.storageCorrect),
    light_color_correct: toBoolean(form.lightColorCorrect),
    light_color_observed:
      form.lightColorCorrect === "no"
        ? normalizeText(form.lightColorObserved) || null
        : null,
    area_clean: toBoolean(form.areaClean),
  };
}
