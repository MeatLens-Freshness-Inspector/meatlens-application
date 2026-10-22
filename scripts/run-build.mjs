import { spawnSync } from "node:child_process";
import { createProcessInvocation } from "./process-runner.mjs";

const isRender = process.env.RENDER === "true";
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const args = isRender ? ["run", "build:backend"] : ["run", "build:all"];

const invocation = createProcessInvocation(npmCommand, args);
const result = spawnSync(invocation.command, invocation.args, {
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
