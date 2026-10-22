const REQUIRED_NODE_VERSION = "22.23.4";

if (process.versions.node !== REQUIRED_NODE_VERSION) {
  console.error(
    `[security:runtime] Node.js ${REQUIRED_NODE_VERSION} is required; found ${process.versions.node}.`,
  );
  process.exitCode = 1;
} else {
  console.log(`[security:runtime] Node.js ${process.versions.node} is approved.`);
}
