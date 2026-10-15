import assert from "node:assert/strict";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { InspectionTimelineSection } from "../../../src/widgets/history";

Object.assign(globalThis, { React });

test("presents saved records with plain search and status controls", () => {
  const markup = renderToStaticMarkup(
    <InspectionTimelineSection
      activeFilter="all"
      filteredCount={0}
      isLoading={false}
      pagedInspections={[]}
      safePage={1}
      searchText=""
      totalPages={1}
      onActiveFilterChange={() => {}}
      onInspectionSelect={() => {}}
      onNextPage={() => {}}
      onPreviousPage={() => {}}
      onSearchTextChange={() => {}}
    />,
  );

  assert.match(markup, /Saved inspections/);
  assert.match(markup, /Find a record by meat or place/);
  assert.match(markup, /Show results/);
  assert.doesNotMatch(markup, /Export PDF/);
});
