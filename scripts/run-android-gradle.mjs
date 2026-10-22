import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createProcessInvocation } from "./process-runner.mjs";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptsDir, "..");
const androidDir = path.join(repoRoot, "android");
const gradleWrapper = process.platform === "win32" ? "gradlew.bat" : "./gradlew";

const invocation = createProcessInvocation(gradleWrapper, process.argv.slice(2));
const result = spawnSync(invocation.command, invocation.args, {
  cwd: androidDir,
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
