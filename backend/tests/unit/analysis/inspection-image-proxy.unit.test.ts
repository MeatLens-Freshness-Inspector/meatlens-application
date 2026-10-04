import assert from "node:assert/strict";
import test from "node:test";

import {
  buildInspectionImagePublicUrl,
  fetchPublicInspectionImage,
} from "../../../src/modules/analysis/infrastructure/InspectionImageProxyService";

test("builds a public storage URL without requiring a service-role key", () => {
  assert.equal(
    buildInspectionImagePublicUrl(
      "https://cwjkepajlhothqldygfr.supabase.co",
      "ea933659-6188-4970-aa99-8735b1975fda",
      "1790300690344.jpg",
    ),
    "https://cwjkepajlhothqldygfr.supabase.co/storage/v1/object/public/inspection-images/ea933659-6188-4970-aa99-8735b1975fda/1790300690344.jpg",
  );
});

test("downloads image bytes and preserves the upstream image content type", async () => {
  const response = await fetchPublicInspectionImage(
    {
      supabaseUrl: "https://example.supabase.co",
      userId: "user-1",
      fileName: "capture.jpg",
    },
    async (input) => {
      assert.equal(
        input,
        "https://example.supabase.co/storage/v1/object/public/inspection-images/user-1/capture.jpg",
      );
      return new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { "Content-Type": "image/jpeg" },
      });
    },
  );

  assert.equal(response.contentType, "image/jpeg");
  assert.deepEqual(Array.from(response.body), [1, 2, 3]);
});

test("rejects upstream non-image responses", async () => {
  await assert.rejects(
    () => fetchPublicInspectionImage(
      {
        supabaseUrl: "https://example.supabase.co",
        userId: "user-1",
        fileName: "capture.jpg",
      },
      async () => new Response("not an image", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      }),
    ),
    /response was not image data/,
  );
});
