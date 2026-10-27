import assert from "node:assert/strict";
import test from "node:test";

import { resolveQueuedInspectionLocation } from "../../../../src/features/offline-sync";

const oldMarket = {
  id: "m1",
  name: "Old Market",
  latitude: 14,
  longitude: 120,
  created_at: "now",
  updated_at: "now",
};

test("nearby coordinates override a stale queued market", () => {
  assert.equal(
    resolveQueuedInspectionLocation(
      { location: "New Market", locationLatitude: 14, locationLongitude: 120.0001 },
      [oldMarket],
    ),
    "Old Market",
  );
});

test("a valid manual fallback survives when no nearby point exists", () => {
  assert.equal(
    resolveQueuedInspectionLocation(
      { location: " old market ", locationLatitude: null, locationLongitude: null },
      [{ ...oldMarket, latitude: null, longitude: null }],
    ),
    "Old Market",
  );
});

test("rejects an unknown manual market", () => {
  assert.equal(
    resolveQueuedInspectionLocation(
      { location: "Unknown Market", locationLatitude: null, locationLongitude: null },
      [oldMarket],
    ),
    null,
  );
});
