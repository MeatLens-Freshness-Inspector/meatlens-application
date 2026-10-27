import assert from "node:assert/strict";
import { test } from "node:test";
import { ListMarketLocations } from "../../../src/modules/markets/application/ListMarketLocations";
import { CreateMarketLocation } from "../../../src/modules/markets/application/CreateMarketLocation";
import { DeleteMarketLocation } from "../../../src/modules/markets/application/DeleteMarketLocation";
import { UpdateMarketLocation } from "../../../src/modules/markets/application/UpdateMarketLocation";

test("market location use cases delegate through explicit ports", async () => {
  const location = {
    id: "1",
    name: "Market",
    latitude: 14,
    longitude: 120,
    created_at: "now",
    updated_at: "now",
  };
  const port = {
    getAll: async () => [location],
    create: async () => location,
    update: async () => location,
    delete: async () => undefined,
  };
  assert.deepEqual(await new ListMarketLocations(port).execute(), [location]);
  assert.equal((await new CreateMarketLocation(port).execute("Market", { latitude: 14, longitude: 120 })).id, "1");
  assert.equal((await new UpdateMarketLocation(port).execute("1", "Market", { latitude: 14, longitude: 120 })).id, "1");
  await new DeleteMarketLocation(port).execute("1");
});
