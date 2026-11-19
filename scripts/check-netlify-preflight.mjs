import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const isNetlifyBuild = process.env.NETLIFY === "true" || process.env.NETLIFY === "1";
if (!isNetlifyBuild) {
  process.exit(0);
}

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiBaseUrl = (process.env.VITE_API_BASE_URL ?? "").trim();

if (!apiBaseUrl) {
  console.error("[netlify-preflight] Missing VITE_API_BASE_URL. Set it in Netlify env vars (Build scope).");
  process.exit(1);
}

if (!/^https?:\/\//i.test(apiBaseUrl)) {
  console.error("[netlify-preflight] VITE_API_BASE_URL must be an absolute URL, e.g. https://your-backend.onrender.com/api");
  process.exit(1);
}

if (!apiBaseUrl.toLowerCase().includes("/api")) {
  console.warn("[netlify-preflight] VITE_API_BASE_URL does not include '/api'. Verify this is intentional.");
}

const modelRoot = path.join(rootDir, "model");
const modelDirectories = ["model1", "model2", "model3", "model4", "model5"];

function hasAsset(directoryName, extension) {
  const directory = path.join(modelRoot, directoryName);
  if (!existsSync(directory)) {
    return false;
  }

  return readdirSync(directory, { withFileTypes: true }).some(
    (entry) => entry.isFile() && entry.name.toLowerCase().endsWith(extension),
  );
}

for (const directoryName of modelDirectories) {
  if (!hasAsset(directoryName, ".onnx")) {
    console.error(`[netlify-preflight] Missing ONNX model in model/${directoryName}.`);
    process.exit(1);
  }

  if (!hasAsset(directoryName, ".json")) {
    console.error(`[netlify-preflight] Missing model metadata in model/${directoryName}.`);
    process.exit(1);
  }
}

console.info("[netlify-preflight] Deployment checks passed for model/model1 through model/model5.");
