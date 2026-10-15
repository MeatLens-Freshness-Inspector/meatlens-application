import assert from "node:assert/strict";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { InspectCaptureSection } from "../../../src/widgets/inspection-workspace/ui/InspectCaptureSection";

Object.assign(globalThis, { React });

test("renders a compact location change affordance and plain capture progress copy", () => {
  const markup = renderToStaticMarkup(
    <InspectCaptureSection
      selectedLocation="Old Market"
      locationDisplayLabel="Old Market"
      coordinateStatusText={null}
      marketLocations={["Old Market", "New Market"]}
      isPreScanChecklistComplete={true}
      isLocationSelectionDisabled={false}
      isCaptureDisabled={false}
      isCaptureCommitted={false}
      showAnalyzeAction={false}
      isAnalyzeDisabled={false}
      isAnalyzeBlockedByModel={false}
      isAnalyzing={false}
      isDebugFileUploadEnabled={false}
      isInAppCameraEnabled={false}
      showModelInputPreview={false}
      disableRoiSegmentation={false}
      captureResetKey={0}
      onSelectedLocationChange={() => undefined}
      onCapture={() => undefined}
      onAnalyze={() => undefined}
    />,
  );

  assert.match(markup, /Open Camera/);
  assert.match(markup, /Change location/);
  assert.doesNotMatch(markup, /MobileNetV3/);
});
