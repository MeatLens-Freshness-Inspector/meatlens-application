import assert from "node:assert/strict";
import test from "node:test";
import { indexedDB as fakeIndexedDb } from "fake-indexeddb";

import {
  clearPendingDocumentationPhotos,
  getPendingDocumentationPhotos,
  queueDocumentationPhoto,
  removeDocumentationPhoto,
} from "../../../../src/features/offline-sync";

const originalIndexedDb = globalThis.indexedDB;

test("offline sync exposes a separate documentation-photo queue", () => {
  assert.equal(typeof queueDocumentationPhoto, "function");
  assert.equal(typeof getPendingDocumentationPhotos, "function");
  assert.equal(typeof removeDocumentationPhoto, "function");
  assert.equal(typeof clearPendingDocumentationPhotos, "function");
});

test("documentation photos round-trip through the browser offline queue", async () => {
  Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: fakeIndexedDb });
  const photo = {
    id: "photo-queue-1",
    imageData: new Uint8Array([1, 2, 3]).buffer,
    imageType: "image/jpeg",
    imageName: "stall.jpg",
    location: "Ikot Palengke",
    locationLatitude: 14.123,
    locationLongitude: 120.456,
    stallNumber: null,
    capturedAt: "2026-10-15T08:00:00.000Z",
    queuedAt: "2026-10-15T08:01:00.000Z",
    userId: "user-1",
  };

  try {
    await clearPendingDocumentationPhotos();
    await queueDocumentationPhoto(photo);
    const queued = await getPendingDocumentationPhotos();
    assert.deepEqual(Array.from(new Uint8Array(queued[0].imageData)), [1, 2, 3]);
    assert.equal(queued[0].location, "Ikot Palengke");
    await removeDocumentationPhoto(photo.id);
    assert.equal((await getPendingDocumentationPhotos()).length, 0);
  } finally {
    Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: originalIndexedDb });
  }
});
