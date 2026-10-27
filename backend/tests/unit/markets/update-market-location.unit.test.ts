import assert from "node:assert/strict";
import test from "node:test";

import { UpdateMarketLocation } from "../../../src/modules/markets/application/UpdateMarketLocation";

test("update market location delegates the complete coordinate pair", async () => {
  const calls: unknown[] = [];
  const port = {
    update: async (...args: unknown[]) => {
      calls.push(args);
      return {
        id: "m1",
        name: "Market",
        latitude: 14,
        longitude: 120,
        created_at: "now",
        updated_at: "now",
      };
    },
  };

  await new UpdateMarketLocation(port).execute(
    "m1",
    "Market",
    { latitude: 14, longitude: 120 },
  );

  assert.deepEqual(calls, [["m1", "Market", { latitude: 14, longitude: 120 }]]);
});
