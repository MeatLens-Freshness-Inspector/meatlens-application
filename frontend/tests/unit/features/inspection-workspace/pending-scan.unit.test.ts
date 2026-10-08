import assert from "node:assert/strict";
import test from "node:test";
import { buildPendingScan } from "../../../../src/widgets/inspection-workspace/model/pending-scan";

test("builds an offline scan payload from the capture and pre-scan state", async () => {
  const scan = await buildPendingScan({
    submissionId: "submission-1",
    capture: {
      file: new File(["image-bytes"], "inspection.jpg", { type: "image/jpeg" }),
      source: "camera",
      capturedAt: "2026-10-09T00:00:00.000Z",
    },
    queuedAt: "2026-10-09T00:01:00.000Z",
    userId: "user-1",
    selectedLocation: "  Market A  ",
    inspectionDecisionSource: null,
    isPreScanBypassed: false,
    preScanForm: {
      stallNumber: " 12 ",
      meatInspectionCertificateProof: " certificate.pdf ",
      meatExpiryDate: "2026-10-12",
      storageCorrect: "yes",
      lightColorCorrect: "no",
      lightColorObserved: "  dim  ",
      areaClean: "yes",
    },
  });

  assert.equal(scan.id, "submission-1");
  assert.equal(scan.userId, "user-1");
  assert.equal(scan.location, "Market A");
  assert.equal(scan.inspectionDecisionSource, "protocol_pre_scan");
  assert.equal(scan.protocolSpoiledReason, "failed_pre_scan_safety_protocol");
  assert.equal(scan.stallNumber, "12");
  assert.equal(scan.meatInspectionCertificateProof, "certificate.pdf");
  assert.equal(scan.lightColorObserved, "dim");
  assert.equal(scan.regulatoryCompliance, false);
  assert.equal(scan.imageType, "image/jpeg");
  assert.equal(scan.imageName, "inspection.jpg");
  assert.deepEqual([...new Uint8Array(scan.imageData)], [...new TextEncoder().encode("image-bytes")]);
});
