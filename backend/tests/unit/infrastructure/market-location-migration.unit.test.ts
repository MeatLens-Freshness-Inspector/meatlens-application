import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

test("market coordinate migration adds paired range-checked columns", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase", "migrations", "20261027100000_add_market_location_coordinates.sql"),
    "utf8",
  ).toLowerCase();

  assert.match(sql, /add column if not exists latitude/);
  assert.match(sql, /add column if not exists longitude/);
  assert.match(sql, /latitude.*between -90 and 90/s);
  assert.match(sql, /longitude.*between -180 and 180/s);
  assert.match(sql, /latitude is null.*longitude is null/s);
  assert.match(sql, /latitude is not null.*longitude is not null/s);
});
