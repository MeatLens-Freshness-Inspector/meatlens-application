import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { test } from "node:test";
import { HistoryMockScene, tutorialDefinitions, tutorialFixtures } from "../../../src/features/tutorials";

test("history tutorial mirrors the simplified saved-record flow", () => {
  const markup = renderToStaticMarkup(
    <HistoryMockScene step={tutorialDefinitions.history[0]} onAdvance={() => {}} />,
  );

  assert.match(markup, /data-tutorial-tab="history"[^>]*data-active="true"/);
  assert.match(markup, new RegExp(tutorialFixtures.history.recordLabel));
  assert.match(markup, /Saved inspections/);
  assert.match(markup, /Find a saved record/);
  assert.match(markup, /Filter results/);
  assert.match(markup, /Documentation photos/);
  assert.match(markup, /Show documentation photos/);
  assert.match(markup, /Open record/);
  assert.match(markup, /Export a report/);
  assert.match(markup, /Without a date, this includes all saved inspections/);
  assert.match(markup, /Choose a date to export one day/);
  assert.match(markup, /Export all inspections as PDF/);
  assert.match(markup, /Show totals and trends/);
  assert.doesNotMatch(markup, /Classification Mix/);
  assert.doesNotMatch(markup, /Recent Activity by Month/);
  assert.doesNotMatch(markup, /More options/);

  const detailMarkup = renderToStaticMarkup(
    <HistoryMockScene step={tutorialDefinitions.history[1]} onAdvance={() => {}} />,
  );

  assert.match(detailMarkup, /Result/);
  assert.match(detailMarkup, /Confidence/);
  assert.match(detailMarkup, /Dispute result/);

  const exportMarkup = renderToStaticMarkup(
    <HistoryMockScene step={tutorialDefinitions.history[3]} onAdvance={() => {}} />,
  );

  assert.match(exportMarkup, /Export a report/);
  assert.match(exportMarkup, /aria-label="Export all inspections as PDF"/);
  assert.match(exportMarkup, /Export all inspections as PDF/);
});
