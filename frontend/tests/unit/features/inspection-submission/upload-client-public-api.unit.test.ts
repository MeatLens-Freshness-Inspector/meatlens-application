import assert from "node:assert/strict";
import test from "node:test";
import {
  UploadClient,
  resolveUploadedInspectionImageUrl,
  uploadClient,
} from "../../../../src/features/inspection-submission";

test("inspection submission publishes the upload client through its feature API", () => {
  assert.equal(typeof UploadClient, "function");
  assert.equal(uploadClient, UploadClient.getInstance());
  assert.equal(typeof uploadClient.uploadInspectionImage, "function");
});

test("inspection upload responses must provide a usable image URL", () => {
  assert.equal(
    resolveUploadedInspectionImageUrl({ imageUrl: " https://storage.example/inspection.jpg " }),
    "https://storage.example/inspection.jpg",
  );
  assert.equal(
    resolveUploadedInspectionImageUrl({ image_url: "https://storage.example/inspection-legacy.jpg" }),
    "https://storage.example/inspection-legacy.jpg",
  );
  assert.throws(
    () => resolveUploadedInspectionImageUrl({ imageUrl: null }),
    /did not return a usable image URL/i,
  );
});
