import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const detailSheetSource = readFileSync(
  new URL(
    "../../../src/widgets/inspection-history/ui/inspection-detail-sheet.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("leads with the saved result and dispute action", () => {
  const summaryIndex = detailSheetSource.indexOf('data-testid="inspection-detail-summary"');
  const disputeIndex = detailSheetSource.indexOf('data-testid="inspection-detail-dispute"');
  const protocolIndex = detailSheetSource.indexOf("Pre-Scan Safety Protocol");

  assert.ok(summaryIndex >= 0);
  assert.ok(disputeIndex >= 0);
  assert.ok(summaryIndex < protocolIndex);
  assert.ok(disputeIndex < protocolIndex);
  assert.match(detailSheetSource, />Result</);
});
