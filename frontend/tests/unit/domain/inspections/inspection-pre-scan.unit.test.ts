import assert from "node:assert/strict";
import test from "node:test";
import {
  EXPIRED_CERTIFICATE_REASON,
  PROTOCOL_SPOILED_REASON,
  buildProtocolSpoiledAnalysisResult,
  createEmptyPreScanForm,
  getInspectionDecisionSource,
  getProtocolSpoiledReason,
  getRegulatoryCompliance,
  hasProtocolFailure,
  isCertificateExpired,
  isPreScanChecklistComplete,
  toInspectionPreScanPayload,
} from "../../../../src/entities/inspection/model/pre-scan";

test("isPreScanChecklistComplete requires all fields and observed light color when the light is incorrect", () => {
  const incomplete = createEmptyPreScanForm();
  assert.equal(isPreScanChecklistComplete(incomplete), false);

  const complete = {
    stallNumber: "12-A",
    meatInspectionCertificateProof: "CERT-77",
    meatExpiryDate: "2099-12-31",
    storageCorrect: "yes" as const,
    lightColorCorrect: "no" as const,
    lightColorObserved: "green",
    areaClean: "yes" as const,
  };

  assert.equal(isPreScanChecklistComplete(complete), true);
  assert.equal(
    isPreScanChecklistComplete({
      ...complete,
      lightColorObserved: " ",
    }),
    false,
  );
});

test("hasProtocolFailure and getInspectionDecisionSource follow the yes-no protocol checks", () => {
  const safeForm = {
    stallNumber: "12-A",
    meatInspectionCertificateProof: "CERT-77",
    meatExpiryDate: "2099-12-31",
    storageCorrect: "yes" as const,
    lightColorCorrect: "yes" as const,
    lightColorObserved: "",
    areaClean: "yes" as const,
  };

  assert.equal(hasProtocolFailure(safeForm), false);
  assert.equal(getInspectionDecisionSource(safeForm), "ai");

  const failedForm = {
    ...safeForm,
    areaClean: "no" as const,
  };

  assert.equal(hasProtocolFailure(failedForm), true);
  assert.equal(getInspectionDecisionSource(failedForm), "protocol_pre_scan");
});

test("expired certificates fail the protocol using the UTC calendar date, while expiring today remains valid", () => {
  assert.equal(isCertificateExpired("2026-10-13", "2026-10-14"), true);
  assert.equal(isCertificateExpired("2026-10-14", "2026-10-14"), false);
  assert.equal(isCertificateExpired("2026-10-15", "2026-10-14"), false);
  assert.equal(isCertificateExpired("", "2026-10-14"), false);
});

test("expired certificates force protocol decisions, the dedicated reason, and non-compliance", () => {
  const expiredForm = {
    stallNumber: "12-A",
    meatInspectionCertificateProof: "CERT-77",
    meatExpiryDate: "2026-10-13",
    storageCorrect: "yes" as const,
    lightColorCorrect: "yes" as const,
    lightColorObserved: "",
    areaClean: "yes" as const,
  };

  assert.equal(hasProtocolFailure(expiredForm, "2026-10-14"), true);
  assert.equal(
    getInspectionDecisionSource(expiredForm, "2026-10-14"),
    "protocol_pre_scan",
  );
  assert.equal(
    getProtocolSpoiledReason(expiredForm, "2026-10-14"),
    EXPIRED_CERTIFICATE_REASON,
  );
  assert.equal(getRegulatoryCompliance(expiredForm, "2026-10-14"), false);
  assert.equal(
    getRegulatoryCompliance({
      ...expiredForm,
      meatExpiryDate: "2026-10-14",
    }, "2026-10-14"),
    true,
  );
});

test("buildProtocolSpoiledAnalysisResult produces the forced-spoiled payload and toInspectionPreScanPayload normalizes field names", () => {
  assert.deepEqual(buildProtocolSpoiledAnalysisResult(), {
    classification: "spoiled",
    confidence_score: 100,
    flagged_deviations: [PROTOCOL_SPOILED_REASON],
    explanation:
      "Automatically classified as spoiled due to failed pre-scan safety protocol. AI analysis was skipped.",
  });

  assert.deepEqual(buildProtocolSpoiledAnalysisResult(EXPIRED_CERTIFICATE_REASON), {
    classification: "spoiled",
    confidence_score: 100,
    flagged_deviations: [EXPIRED_CERTIFICATE_REASON],
    explanation:
      "Automatically classified as spoiled because the meat inspection certificate is expired. AI analysis was skipped.",
  });

  assert.deepEqual(
    toInspectionPreScanPayload({
      stallNumber: " 12-A ",
      meatInspectionCertificateProof: " CERT-77 ",
      meatExpiryDate: "2026-07-10",
      storageCorrect: "no",
      lightColorCorrect: "no",
      lightColorObserved: " green ",
      areaClean: "yes",
    }),
    {
      stall_number: "12-A",
      meat_inspection_certificate_proof: "CERT-77",
      meat_expiry_date: "2026-07-10",
      storage_correct: false,
      light_color_correct: false,
      light_color_observed: "green",
      area_clean: true,
    },
  );
});
