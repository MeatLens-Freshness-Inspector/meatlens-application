import assert from "node:assert/strict";
import test from "node:test";

import {
  readCachedMarketLocations,
  writeCachedMarketLocations,
} from "../../../../src/entities/market-location";

function createStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
}

test("round-trips coordinate-bearing market rows", () => {
  const storage = createStorage();
  const rows = [{
    id: "m1",
    name: "Market",
    latitude: 14,
    longitude: 120,
    created_at: "now",
    updated_at: "now",
  }];

  writeCachedMarketLocations(storage, rows);
  assert.deepEqual(readCachedMarketLocations(storage), rows);
});

test("ignores malformed cache data without blocking capture", () => {
  const storage = createStorage({ "meatlens.market-locations.v1": "not-json" });
  assert.deepEqual(readCachedMarketLocations(storage), []);
});

test("filters malformed rows from otherwise valid cache data", () => {
  const storage = createStorage({
    "meatlens.market-locations.v1": JSON.stringify([
      { id: "m1", name: "Valid", latitude: null, longitude: null, created_at: "", updated_at: "" },
      { id: "m2", name: "Invalid", latitude: "14", longitude: 120 },
    ]),
  });

  assert.deepEqual(readCachedMarketLocations(storage).map((row) => row.id), ["m1"]);
});
