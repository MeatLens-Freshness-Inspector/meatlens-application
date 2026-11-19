import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const thisFile = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(thisFile), "..");
const modelRoot = path.join(repoRoot, "model");
const publicModelRoot = path.join(repoRoot, "frontend", "public", "model");
const modelDirectories = ["model1", "model2", "model3", "model4", "model5"];
const browserAssetExtensions = new Set([".json", ".onnx", ".txt"]);

function copyIfChanged(sourcePath, targetPath) {
  mkdirSync(path.dirname(targetPath), { recursive: true });

  let shouldCopy = true;
  if (existsSync(targetPath)) {
    const sourceStat = statSync(sourcePath);
    const targetStat = statSync(targetPath);
    shouldCopy =
      sourceStat.size !== targetStat.size ||
      targetStat.mtimeMs < sourceStat.mtimeMs;
  }

  if (!shouldCopy) {
    console.info(`[sync-onnx-model] Up to date: ${path.relative(repoRoot, targetPath)}`);
    return;
  }

  copyFileSync(sourcePath, targetPath);
  console.info(
    `[sync-onnx-model] Copied ${path.relative(repoRoot, sourcePath)} -> ${path.relative(repoRoot, targetPath)}`,
  );
}

function syncModelDirectory(directoryName) {
  const sourceDirectory = path.join(modelRoot, directoryName);
  const targetDirectory = path.join(publicModelRoot, directoryName);

  if (!existsSync(sourceDirectory)) {
    throw new Error(`[sync-onnx-model] Missing canonical model directory: ${path.relative(repoRoot, sourceDirectory)}`);
  }

  for (const entry of readdirSync(sourceDirectory, { withFileTypes: true })) {
    if (!entry.isFile() || !browserAssetExtensions.has(path.extname(entry.name).toLowerCase())) {
      continue;
    }

    copyIfChanged(
      path.join(sourceDirectory, entry.name),
      path.join(targetDirectory, entry.name),
    );
  }
}

for (const directoryName of modelDirectories) {
  syncModelDirectory(directoryName);
}

const ortDistDirectory = path.join(repoRoot, "node_modules", "onnxruntime-web", "dist");
const ortPublicDirectory = path.join(repoRoot, "frontend", "public", "ort");
const ortRuntimeFiles = [
  "ort-wasm-simd-threaded.wasm",
  "ort-wasm-simd-threaded.mjs",
  "ort-wasm-simd-threaded.jsep.wasm",
  "ort-wasm-simd-threaded.jsep.mjs",
  "ort-wasm-simd-threaded.jspi.wasm",
  "ort-wasm-simd-threaded.jspi.mjs",
  "ort-wasm-simd-threaded.asyncify.wasm",
  "ort-wasm-simd-threaded.asyncify.mjs",
];

for (const runtimeFile of ortRuntimeFiles) {
  const sourcePath = path.join(ortDistDirectory, runtimeFile);
  if (!existsSync(sourcePath)) {
    console.warn(`[sync-onnx-model] Missing runtime file: ${path.relative(repoRoot, sourcePath)}`);
    continue;
  }

  copyIfChanged(sourcePath, path.join(ortPublicDirectory, runtimeFile));
}
