import assert from "node:assert/strict";
import test from "node:test";

import {
  marketLocationClient,
  MarketLocationClient,
} from "../../../../src/entities/market-location";

test("market location client exposes coordinate-aware create and update methods", () => {
  assert.equal(marketLocationClient, MarketLocationClient.getInstance());
  assert.equal(typeof marketLocationClient.create, "function");
  assert.equal(typeof marketLocationClient.update, "function");
});
