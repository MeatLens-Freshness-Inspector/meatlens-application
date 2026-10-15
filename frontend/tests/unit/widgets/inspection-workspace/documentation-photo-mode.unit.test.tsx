import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("documentation photo mode gives inspectors a plain photo choice", () => {
  const source = readFileSync(
    new URL("../../../../src/widgets/inspection-workspace/ui/InspectCaptureModeSection.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /Analyze sample/);
  assert.match(source, /Take photo only/);
  assert.match(source, /Capture mode/);
  assert.doesNotMatch(source, /What do you want to do/);
});

test("inspect starts in analyze mode without a separate mode picker", () => {
  const workspaceSource = readFileSync(
    new URL("../../../../src/widgets/inspection-workspace/ui/inspection-workspace.tsx", import.meta.url),
    "utf8",
  );
  const modelSource = readFileSync(
    new URL("../../../../src/widgets/inspection-workspace/model/use-inspection-workspace.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(workspaceSource, /showCaptureModePicker/);
  assert.match(modelSource, /useState<InspectionCaptureMode>\("analyze"\)/);
  assert.match(modelSource, /setCaptureMode\("analyze"\)/);
});
