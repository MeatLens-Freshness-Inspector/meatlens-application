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
  assert.match(source, /No result or analysis/);
});
