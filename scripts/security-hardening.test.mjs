import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const repoRoot = join(import.meta.dirname, "..");

function findSourceFiles(relativeDirectory) {
  const directory = join(repoRoot, relativeDirectory);
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const relativePath = join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...findSourceFiles(relativePath));
    } else if (/\.(c|m)?js$|\.ts$|\.tsx$/.test(entry.name)) {
      files.push(relativePath);
    }
  }

  return files;
}

test("repository process runners do not enable shell execution", () => {
  for (const file of ["scripts/run-dev.mjs", "scripts/run-build.mjs", "scripts/run-android-gradle.mjs"]) {
    assert.doesNotMatch(readFileSync(join(repoRoot, file), "utf8"), /shell\s*:\s*(true|process\.platform)/, file);
  }
});

test("backend application code has no child-process or dynamic-code execution", () => {
  for (const file of findSourceFiles("backend/src")) {
    const source = readFileSync(join(repoRoot, file), "utf8");
    assert.doesNotMatch(source, /(?:node:)?child_process|\beval\s*\(|new\s+Function\s*\(/, file);
  }
});

test("process runner source files remain ordinary files", () => {
  for (const file of ["scripts/run-dev.mjs", "scripts/run-build.mjs", "scripts/run-android-gradle.mjs"]) {
    assert.equal(statSync(join(repoRoot, file)).isFile(), true, file);
  }
});

test("process invocations use direct execution on POSIX", async () => {
  const { createProcessInvocation } = await import("./process-runner.mjs");
  assert.deepEqual(createProcessInvocation("npm", ["run", "build"], "linux"), {
    command: "npm",
    args: ["run", "build"],
  });
});

test("process invocations use a fixed Windows command shell without shell mode", async () => {
  const { createProcessInvocation } = await import("./process-runner.mjs");
  const invocation = createProcessInvocation("npm.cmd", ["run", "build"], "win32");
  assert.equal(invocation.args[0], "/d");
  assert.equal(invocation.args[1], "/s");
  assert.equal(invocation.args[2], "/c");
  assert.deepEqual(invocation.args.slice(3), ["npm.cmd", "run", "build"]);
  assert.equal("shell" in invocation, false);
});

test("process invocations reject non-string arguments", async () => {
  const { createProcessInvocation } = await import("./process-runner.mjs");
  assert.throws(() => createProcessInvocation("npm", ["run", 42], "linux"), TypeError);
});
