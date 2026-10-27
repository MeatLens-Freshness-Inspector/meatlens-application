import assert from "node:assert/strict";
import test from "node:test";

import {
  InvalidInspectionMarketLocationError,
  ResolveInspectionMarket,
} from "../../../src/modules/markets/application/ResolveInspectionMarket";

const oldMarket = {
  id: "m1",
  name: "Old Market",
  latitude: 14,
  longitude: 120,
  created_at: "now",
  updated_at: "now",
};

test("canonicalizes a stale manual name when coordinates match another market", async () => {
  const result = await new ResolveInspectionMarket({
    getAll: async () => [oldMarket],
  }).execute({
    location: "New Market",
    location_latitude: 14,
    location_longitude: 120.0001,
  });

  assert.equal(result, "Old Market");
});

test("accepts a valid manual name without coordinates", async () => {
  const result = await new ResolveInspectionMarket({
    getAll: async () => [{ ...oldMarket, latitude: null, longitude: null }],
  }).execute({
    location: " old market ",
    location_latitude: null,
    location_longitude: null,
  });

  assert.equal(result, "Old Market");
});

test("rejects an unknown manual name when GPS cannot classify", async () => {
  await assert.rejects(
    () => new ResolveInspectionMarket({ getAll: async () => [oldMarket] }).execute({
      location: "Unknown Market",
      location_latitude: null,
      location_longitude: null,
    }),
    InvalidInspectionMarketLocationError,
  );
});

test("rejects partial coordinates", async () => {
  await assert.rejects(
    () => new ResolveInspectionMarket({ getAll: async () => [oldMarket] }).execute({
      location: "Old Market",
      location_latitude: 14,
      location_longitude: null,
    }),
    /longitude.*required/i,
  );
});
