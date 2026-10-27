import assert from "node:assert/strict";
import test from "node:test";

import { resolveMarketLocation, type MarketLocation } from "../../../../src/entities/market-location";

const baseMarket = (overrides: Partial<MarketLocation> = {}): MarketLocation => ({
  id: "m1",
  name: "Boundary Market",
  latitude: 14,
  longitude: 120,
  created_at: "now",
  updated_at: "now",
  ...overrides,
});

test("matches a market at exactly the 50 metre boundary", () => {
  const result = resolveMarketLocation(
    { latitude: 14, longitude: 120.00044966 },
    [baseMarket()],
  );

  assert.equal(result.kind, "auto");
  if (result.kind === "auto") assert.equal(result.market.id, "m1");
});

test("chooses the closest configured market and ignores unconfigured rows", () => {
  const result = resolveMarketLocation(
    { latitude: 14, longitude: 120.0001 },
    [
      baseMarket({ id: "far", name: "Far Market", longitude: 120.0003 }),
      baseMarket({ id: "near", name: "Near Market", longitude: 120.0001 }),
      baseMarket({ id: "missing", name: "Missing Market", latitude: null, longitude: null }),
    ],
  );

  assert.equal(result.kind, "auto");
  if (result.kind === "auto") assert.equal(result.market.id, "near");
});

test("resolves equal-distance ties by market name and then id", () => {
  const result = resolveMarketLocation(
    { latitude: 14, longitude: 120 },
    [
      baseMarket({ id: "z", name: "Zulu Market", longitude: 120.0001 }),
      baseMarket({ id: "a", name: "Alpha Market", longitude: 119.9999 }),
    ],
  );

  assert.equal(result.kind, "auto");
  if (result.kind === "auto") assert.equal(result.market.name, "Alpha Market");
});

test("returns unresolved when GPS is unavailable, invalid, or outside the radius", () => {
  assert.deepEqual(resolveMarketLocation(null, []), {
    kind: "unresolved",
    reason: "missing_coordinates",
  });
  assert.deepEqual(resolveMarketLocation({ latitude: 91, longitude: 120 }, [baseMarket()]), {
    kind: "unresolved",
    reason: "missing_coordinates",
  });
  assert.deepEqual(resolveMarketLocation({ latitude: 10, longitude: 110 }, [baseMarket()]), {
    kind: "unresolved",
    reason: "no_match",
  });
});
