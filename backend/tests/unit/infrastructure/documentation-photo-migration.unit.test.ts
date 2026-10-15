import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

test("documentation photos migration is user-scoped and retry-safe", () => {
  const migration = readFileSync(
    join(process.cwd(), "supabase", "migrations", "20261015090000_add_documentation_photos.sql"),
    "utf8",
  ).toLowerCase();

  assert.match(migration, /create table public\.documentation_photos/);
  assert.match(migration, /client_submission_id uuid not null unique/);
  assert.match(migration, /references auth\.users\(id\)/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /create policy/);
});
