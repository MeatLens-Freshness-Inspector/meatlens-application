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
  assert.match(markup, /Find a record by meat or place/);
  assert.match(markup, /Open record/);

  const detailMarkup = renderToStaticMarkup(
    <HistoryMockScene step={tutorialDefinitions.history[1]} onAdvance={() => {}} />,
  );

  assert.match(detailMarkup, /Result/);
  assert.match(detailMarkup, /Confidence/);
  assert.match(detailMarkup, /Dispute result/);
});
