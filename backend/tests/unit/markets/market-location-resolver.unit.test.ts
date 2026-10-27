import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeMarketCoordinates,
  normalizeOptionalMarketCoordinates,
  resolveNearestMarketLocation,
} from "../../../src/modules/markets/domain/market-location-resolver";

const baseMarket = (overrides: Record<string, unknown> = {}) => ({
  id: "m1",
  name: "Boundary Market",
  latitude: 14,
  longitude: 120,
  ...overrides,
});

test("requires latitude and longitude together", () => {
  assert.throws(
    () => normalizeMarketCoordinates({ latitude: 14.5, longitude: undefined }),
    /longitude.*required/i,
  );
  assert.throws(
    () => normalizeMarketCoordinates({ latitude: 91, longitude: 120 }),
    /latitude.*within/i,
  );
  assert.equal(
    normalizeOptionalMarketCoordinates({ latitude: null, longitude: null }),
    null,
  );
});

test("rejects non-numeric coordinate values instead of coercing them", () => {
  for (const value of [true, [], "   "]) {
    assert.throws(
      () => normalizeMarketCoordinates({ latitude: value, longitude: 120 }),
      /latitude.*valid number|latitude.*required/i,
    );
  }
});

test("returns the nearest configured market at the inclusive boundary", () => {
  const result = resolveNearestMarketLocation(
    { latitude: 14, longitude: 120.00044966 },
    [
      baseMarket({ id: "far", name: "Far Market", longitude: 120.0015 }),
      baseMarket({ id: "boundary", name: "Boundary Market" }),
      baseMarket({ id: "missing", name: "Missing Market", latitude: null, longitude: null }),
    ],
  );

  assert.equal(result?.market.id, "boundary");
});

test("resolves equal-distance ties by name and then id", () => {
  const result = resolveNearestMarketLocation(
    { latitude: 14, longitude: 120 },
    [
      baseMarket({ id: "z", name: "Zulu Market", longitude: 120.0001 }),
      baseMarket({ id: "a", name: "Alpha Market", longitude: 119.9999 }),
    ],
  );

  assert.equal(result?.market.name, "Alpha Market");
});

test("returns null when no configured market is within the radius", () => {
  assert.equal(
    resolveNearestMarketLocation(
      { latitude: 10, longitude: 110 },
      [baseMarket()],
    ),
    null,
  );
});
