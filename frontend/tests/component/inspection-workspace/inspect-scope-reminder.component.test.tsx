import assert from "node:assert/strict";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

import { InspectScopeReminder } from "../../../src/widgets/inspection-workspace/ui/InspectScopeReminder";

Object.assign(globalThis, { React });

test("collapses scope details by default while keeping the reminder heading", () => {
  const markup = renderToStaticMarkup(
    <MemoryRouter>
      <InspectScopeReminder />
    </MemoryRouter>,
  );

  assert.match(markup, /Scope Reminder/);
  assert.match(markup, /aria-expanded="false"/);
  assert.doesNotMatch(markup, /Pork samples only/);
  assert.doesNotMatch(markup, /Scope and delimitations/);
});
