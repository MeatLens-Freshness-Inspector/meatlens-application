import assert from "node:assert/strict";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { HistoryMoreOptions } from "../../../src/widgets/history/ui/history-more-options";
import type { FreshnessClassification } from "../../../src/entities/inspection";

Object.assign(globalThis, { React });

const classificationCounts: Record<FreshnessClassification, number> = {
  fresh: 2,
  "not fresh": 0,
  acceptable: 0,
  warning: 0,
  spoiled: 1,
};

const baseProps = {
  classificationCounts,
  exportProgress: null,
  isExportingDetailedPdf: false,
  monthlyCounts: [{ label: "August 2026", count: 3 }],
  selectedDayAverageConfidence: 88,
  selectedDayCount: 1,
  totalInspections: 3,
  onExportDetailedPdf: () => {},
  onReportDayChange: () => {},
};

test("explains that export without a date includes all saved inspections", () => {
  const markup = renderToStaticMarkup(
    <HistoryMoreOptions
      {...baseProps}
      formattedReportDayLabel={null}
      hasValidReportDay={false}
      selectedReportDay=""
    />,
  );

  assert.match(markup, /More options/);
  assert.match(markup, /PDF will include all saved inspections/);
  assert.match(markup, /Export all inspections as PDF/);
  assert.match(markup, /Classification Mix/);
  assert.match(markup, /Recent Activity by Month/);
});

test("explains that a selected date limits the exported PDF", () => {
  const markup = renderToStaticMarkup(
    <HistoryMoreOptions
      {...baseProps}
      formattedReportDayLabel="August 5, 2026"
      hasValidReportDay={true}
      selectedReportDay="2026-08-05"
    />,
  );

  assert.match(markup, /PDF will include inspections from August 5, 2026/);
  assert.match(markup, /Export this day as PDF/);
});
