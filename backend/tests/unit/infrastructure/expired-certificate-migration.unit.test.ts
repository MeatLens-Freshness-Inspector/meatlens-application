import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20261014100000_enforce_expired_certificate_safety.sql",
);

test("expired certificate migration enforces the safety invariant at the database boundary", () => {
  const sql = readFileSync(migrationPath, "utf8").toLowerCase();

  assert.match(sql, /create or replace function public\.enforce_expired_certificate_safety/);
  assert.match(sql, /new\.meat_expiry_date\s*<\s*\(timezone\('utc', now\(\)\)\)::date/);
  assert.match(sql, /new\.classification\s*:=\s*'spoiled'/);
  assert.match(sql, /new\.manual_classification\s*:=\s*'spoiled'/);
  assert.match(sql, /new\.confidence_score\s*:=\s*100/);
  assert.match(sql, /expired_meat_inspection_certificate/);
  assert.match(sql, /new\.inspection_decision_source\s*:=\s*'protocol_pre_scan'/);
  assert.match(sql, /new\.regulatory_compliance\s*:=\s*false/);
  assert.match(sql, /array_append/);
  assert.match(sql, /create trigger zz_inspections_enforce_expired_certificate_safety/);
  assert.doesNotMatch(sql, /update\s+public\.inspections/);
});
