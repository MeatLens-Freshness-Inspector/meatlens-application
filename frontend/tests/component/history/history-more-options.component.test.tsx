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

test("keeps report export visible while hiding totals and trends until requested", () => {
  const markup = renderToStaticMarkup(
    <HistoryMoreOptions
      {...baseProps}
      formattedReportDayLabel={null}
      hasValidReportDay={false}
      selectedReportDay=""
    />,
  );

  assert.match(markup, /Export a report/);
  assert.match(markup, /Without a date, this includes all saved inspections/);
  assert.match(markup, /Export all inspections as PDF/);
  assert.match(markup, /Choose a date to export one day/);
  assert.match(markup, /Show totals and trends/);
  assert.doesNotMatch(markup, /More options/);
  assert.doesNotMatch(markup, /Classification Mix/);
  assert.doesNotMatch(markup, /Recent Activity by Month/);
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

  assert.match(markup, /This report will include inspections from August 5, 2026/);
  assert.match(markup, /Export this day as PDF/);
});
