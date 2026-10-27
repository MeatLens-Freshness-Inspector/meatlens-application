import assert from "node:assert/strict";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { InspectCaptureSection } from "../../../src/widgets/inspection-workspace/ui/InspectCaptureSection";

Object.assign(globalThis, { React });

const baseProps = {
  selectedLocation: "Old Market",
  coordinateStatusText: null,
  locationDistanceMeters: null,
  isOnline: true,
  marketLocations: ["Old Market", "New Market"],
  isPreScanChecklistComplete: true,
  isLocationSelectionDisabled: true,
  isCaptureDisabled: false,
  isCaptureCommitted: false,
  isAnalyzeBlockedByModel: false,
  isAnalyzing: false,
  isAnalysisPending: false,
  isDebugFileUploadEnabled: false,
  isInAppCameraEnabled: false,
  showModelInputPreview: false,
  disableRoiSegmentation: false,
  captureResetKey: 0,
  onSelectedLocationChange: () => undefined,
  onCapture: () => undefined,
};

test("renders and labels the automatic market match", () => {
  const markup = renderToStaticMarkup(
    <InspectCaptureSection
      {...baseProps}
      locationResolution="automatic"
      locationDistanceMeters={23.4}
    />,
  );

  assert.match(markup, /Auto-detected: Old Market · 23 m away/);
  assert.match(markup, /data-location-resolution="automatic"/);
});

test("renders the manual closest-market fallback", () => {
  const markup = renderToStaticMarkup(
    <InspectCaptureSection
      {...baseProps}
      locationResolution="manual"
      selectedLocation=""
      isLocationSelectionDisabled={false}
    />,
  );

  assert.match(markup, /Select the closest market/);
  assert.match(markup, /data-location-resolution="manual"/);
});
