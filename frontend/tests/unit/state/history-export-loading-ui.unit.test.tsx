import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { test } from "node:test";
import { HistoryMoreOptions } from "../../../src/widgets/history/ui/history-more-options";

Object.assign(globalThis, { React });

const classificationCounts = {
  fresh: 1,
  "not fresh": 0,
  acceptable: 0,
  warning: 0,
  spoiled: 0,
} as const;

test("inspection history shows a blocking loading state during PDF export", () => {
  const markup = renderToStaticMarkup(
    <HistoryMoreOptions
      classificationCounts={classificationCounts}
      exportProgress={{ current: 2, total: 3 }}
      formattedReportDayLabel="August 26, 2026"
      hasValidReportDay
      isExportingDetailedPdf
      monthlyCounts={[]}
      selectedDayAverageConfidence={0}
      selectedDayCount={1}
      selectedReportDay="2026-08-26"
      totalInspections={1}
      onExportDetailedPdf={() => undefined}
      onReportDayChange={() => undefined}
    />,
  );

  assert.match(markup, /Preparing PDF export\.\.\./);
  assert.match(markup, /aria-busy="true"/);
  assert.match(markup, /Preparing PDF\.\.\./);
  assert.match(markup, /role="progressbar"/);
  assert.match(markup, /aria-valuenow="2"/);
});
