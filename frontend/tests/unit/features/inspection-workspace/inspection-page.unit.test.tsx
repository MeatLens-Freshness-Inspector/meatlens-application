import assert from "node:assert/strict";
import test from "node:test";

import InspectPage from "../../../../src/pages/inspector/inspect-page";
import { getDocumentationPhotoStallNumber } from "../../../../src/widgets/inspection-workspace/model/inspect-page";

test("inspect route owns a page component", () => {
  assert.equal(typeof InspectPage, "function");
});

test("documentation photos preserve the entered stall number", () => {
  assert.equal(
    getDocumentationPhotoStallNumber({ stallNumber: " 12-A " }),
    "12-A",
  );
  assert.equal(getDocumentationPhotoStallNumber({ stallNumber: " " }), null);
});
