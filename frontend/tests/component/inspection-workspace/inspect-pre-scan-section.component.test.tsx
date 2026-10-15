import assert from "node:assert/strict";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { InspectionPreScanForm } from "../../../src/entities/inspection";
import { InspectPreScanSection } from "../../../src/widgets/inspection-workspace/ui/InspectPreScanSection";

Object.assign(globalThis, { React });

const form: InspectionPreScanForm = {
  stallNumber: "12-A",
  meatInspectionCertificateProof: "CERT-77",
  meatExpiryDate: "2099-12-31",
  storageCorrect: "yes",
  lightColorCorrect: "no",
  lightColorObserved: "green",
  areaClean: "yes",
};

test("renders large responsive radio choices for all regulatory questions", () => {
  const markup = renderToStaticMarkup(
    <InspectPreScanSection
      form={form}
      isBypassed={false}
      isChecklistComplete={false}
      isLocked={false}
      onFieldChange={() => undefined}
    />,
  );

  for (const label of ["Storage Correct", "Light Color Correct", "Area Clean"]) {
    assert.match(markup, new RegExp(label));
  }
  assert.equal((markup.match(/role="radiogroup"/g) ?? []).length, 3);
  assert.equal((markup.match(/role="radio"/g) ?? []).length, 6);
  assert.equal((markup.match(/>Yes<[^>]*>/g) ?? []).length, 3);
  assert.equal((markup.match(/>No<[^>]*>/g) ?? []).length, 3);
  assert.match(markup, /grid-cols-1/);
  assert.match(markup, /sm:grid-cols-2/);
  assert.match(markup, /What Color\?/);
  assert.match(markup, /Before you scan/);
  assert.match(markup, /Check the stall details and safety conditions before taking a photo/);
});

test("warns when the meat inspection certificate is expired", () => {
  const markup = renderToStaticMarkup(
    <InspectPreScanSection
      form={{ ...form, meatExpiryDate: "2000-01-01" }}
      isBypassed={false}
      isChecklistComplete={true}
      isLocked={false}
      onFieldChange={() => undefined}
    />,
  );

  assert.match(markup, /role="alert"/);
  assert.match(
    markup,
    /Certificate is expired\. Any captured meat will be automatically classified as spoiled, and AI analysis will be skipped\./,
  );
});
