import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../../../../src/widgets/legal/terms-content.tsx", import.meta.url),
  "utf8",
);

test("terms use the canonical freshness vocabulary", () => {
  assert.match(source, /Fresh/);
  assert.match(source, /Not Fresh/);
  assert.match(source, /Spoiled/);
  assert.doesNotMatch(source, /Suspect/);
});

test("terms explain recommended device specifications and assessment boundaries", () => {
  assert.match(source, /Android 12/);
  assert.match(source, /iOS 22/);
  assert.match(source, /8 GB of RAM/);
  assert.match(source, /at least 50 MP/);
  assert.match(source, /may still work/);
  assert.match(source, /does not assess sickness/);
});

test("terms explicitly exclude sick-meat and unsupported-condition scanning", () => {
  assert.match(source, /sick meat/i);
  assert.match(source, /pathogens/i);
  assert.match(source, /contamination/i);
  assert.match(source, /chemical adulteration/i);
  assert.match(source, /non-pork/i);
});
