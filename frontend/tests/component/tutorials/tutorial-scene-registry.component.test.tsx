import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { test } from "node:test";
import {
  TutorialScene,
  firstRunOnboardingSteps,
  tutorialDefinitions,
} from "../../../src/features/tutorials";

test("every first-run tutorial step resolves to a current app-tab scene", () => {
  for (const step of firstRunOnboardingSteps) {
    const expectedTab = step.tutorialId === "profile"
      ? "profile"
      : step.tutorialId === "history"
        ? "history"
        : step.tutorialId === "messages"
          ? "messages"
          : "inspect";
    const markup = renderToStaticMarkup(<TutorialScene step={step} onAdvance={() => {}} />);
    assert.match(markup, new RegExp(`data-tutorial-scene="${step.id}"`));
    assert.match(markup, /data-tutorial-app-shell/);
    assert.match(markup, new RegExp(`data-tutorial-tab="${expectedTab}"[^>]*data-active="true"`));
  }
});

test("Inspect tutorial mirrors automatic analysis and post-save disputes", () => {
  const inspectSteps = tutorialDefinitions.inspect;
  assert.deepEqual(inspectSteps.map((step) => step.id), [
    "inspect-scope",
    "inspect-market",
    "inspect-prescan",
    "inspect-capture",
    "inspect-save",
    "inspect-dispute",
  ]);

  const renderStep = (id: string) => {
    const step = inspectSteps.find((candidate) => candidate.id === id);
    assert.ok(step);
    return renderToStaticMarkup(<TutorialScene step={step} onAdvance={() => {}} />);
  };

  const captureMarkup = renderStep("inspect-capture");
  assert.match(captureMarkup, /analysis starts automatically/i);
  assert.doesNotMatch(captureMarkup, /Analyze Sample/);

  const preScanMarkup = renderStep("inspect-prescan");
  assert.match(preScanMarkup, /Light Color Correct/);
  assert.match(preScanMarkup, /Area Clean/);

  const saveMarkup = renderStep("inspect-save");
  assert.match(saveMarkup, /Save the inspection first to dispute this result/);

  const disputeMarkup = renderStep("inspect-dispute");
  assert.match(disputeMarkup, /Dispute result/);
  assert.match(disputeMarkup, /saved inspection/i);
});
