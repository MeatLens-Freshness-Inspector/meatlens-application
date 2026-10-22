import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const repoRoot = join(import.meta.dirname, "..");
const pinnedNodeVersion = "22.23.4";

function read(relativePath) {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

test("all repository runtime selectors use the patched Node 22 release", () => {
  const runtimeFiles = [
    ".nvmrc",
    "render.yaml",
    "netlify.toml",
    "backend/Dockerfile",
    "frontend/Dockerfile",
    ".github/workflows/ci.yml",
    ".github/workflows/preview.yml",
    ".github/workflows/deploy-refresh.yml",
  ];

  for (const file of runtimeFiles) {
    assert.match(read(file), new RegExp(`\\b${pinnedNodeVersion.replaceAll(".", "\\.")}\\b`), file);
  }
});

test("the root package exposes the runtime security check", () => {
  const packageJson = JSON.parse(read("package.json"));
  assert.equal(packageJson.scripts["security:runtime"], "node scripts/check-node-runtime.mjs");
});
