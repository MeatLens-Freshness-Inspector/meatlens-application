import assert from "node:assert/strict";
import test from "node:test";
import { parseMarketCoordinateInput } from "../../../../src/features/admin-management/model/use-market-form";

test("rejects a market with only one coordinate", () => {
  assert.equal(parseMarketCoordinateInput("14.6", ""), null);
});

test("normalizes valid coordinate input to numbers", () => {
  assert.deepEqual(parseMarketCoordinateInput("14.600000", "120.980000"), {
    latitude: 14.6,
    longitude: 120.98,
  });
});

test("rejects coordinates outside their geographic ranges", () => {
  assert.equal(parseMarketCoordinateInput("91", "120"), null);
  assert.equal(parseMarketCoordinateInput("14", "181"), null);
});
