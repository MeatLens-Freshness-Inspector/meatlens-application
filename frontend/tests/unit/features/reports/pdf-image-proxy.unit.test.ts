import assert from "node:assert/strict";
import test from "node:test";

import { buildInspectionImageRequestUrl } from "../../../../src/features/reports/lib/pdf/assets";

test("routes Supabase inspection image URLs through the backend proxy", () => {
  assert.equal(
    buildInspectionImageRequestUrl(
      "https://cwjkepajlhothqldygfr.supabase.co/storage/v1/object/public/inspection-images/ea933659-6188-4970-aa99-8735b1975fda/1790300690344.jpg",
    ),
    "http://localhost:3001/api/upload/inspection-image/ea933659-6188-4970-aa99-8735b1975fda/1790300690344.jpg",
  );
});

test("leaves non-Supabase report image URLs unchanged", () => {
  const imageUrl = "https://example.com/inspection.jpg";
  assert.equal(buildInspectionImageRequestUrl(imageUrl), imageUrl);
});
