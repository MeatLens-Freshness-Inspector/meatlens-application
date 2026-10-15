# History Tab Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with verification checkpoints.

**Goal:** Make inspector History record lookup fast and plain-language while preserving reporting, filtering, detail review, and dispute capabilities.

**Architecture:** Keep `useHistory` as the single owner of inspection selection, filtering, pagination, and PDF export state. Refactor the History page into a primary saved-record list plus a collapsed `More options` panel for date filtering, export, and analytics. Keep the existing inspection detail sheet and report adapter contracts, passing an explicit all-record scope when no date is selected.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Radix/shared UI primitives, date-fns, Node test runner through `tsx`, Vite.

## Global Constraints

- Frontend-only change; do not modify backend routes, database schema, migrations, or persistence behavior.
- Preserve existing filtering, pagination, direct `{ inspectionId }` navigation, PDF report contents, and dispute submission semantics.
- Use test-first development: each behavior change gets a failing test before production code.
- Keep primary labels sentence case and understandable to non-technical meat inspectors.
- No focused, skipped, weakened, or swallowed tests.

---

### Task 1: Define all-record and date-scoped export behavior

**Files:**
- Modify: `frontend/src/widgets/history/model/history-page.ts`
- Modify: `frontend/src/widgets/history/model/types.ts`
- Modify: `frontend/src/widgets/history/model/use-history.ts`
- Test: `frontend/tests/unit/domain/analysis/history-report-pdf-export.unit.test.ts`
- Test: `frontend/tests/unit/hooks/history-page-filter.unit.test.ts`

**Interfaces:**
- Add `HistoryExportScope` with `hasSelectedDay`, `inspections`, `reportDayLabel`, `filenameScope`, `scopeLabel`, and `averageConfidence` fields.
- Add `buildHistoryExportScope(input)` in `history-page.ts`; it returns all loaded inspections and an all-record label when `selectedReportDay` is empty, otherwise it returns the selected-day inspections and date label.
- `useHistory.handleExportDetailedPdf` consumes `buildHistoryExportScope` and no longer rejects an empty date.

- [ ] **Step 1: Write the failing tests**

Add tests for the pure scope builder:

```ts
test("history export defaults to all saved inspections without a date", () => {
  const scope = buildHistoryExportScope({
    allInspections: [freshInspection, spoiledInspection],
    selectedDayInspections: [],
    selectedReportDay: "",
    formattedReportDayLabel: null,
    averageConfidence: 92,
    selectedDayAverageConfidence: 0,
  });

  assert.deepEqual(scope.inspections, [freshInspection, spoiledInspection]);
  assert.equal(scope.scopeLabel, "all saved inspections");
  assert.equal(scope.reportDayLabel, "All saved inspections");
  assert.equal(scope.filenameScope, "all-inspections");
  assert.equal(scope.averageConfidence, 92);
});

test("history export uses only the selected day when a date is present", () => {
  const scope = buildHistoryExportScope({
    allInspections: [freshInspection, spoiledInspection],
    selectedDayInspections: [spoiledInspection],
    selectedReportDay: "2026-08-05",
    formattedReportDayLabel: "August 5, 2026",
    averageConfidence: 92,
    selectedDayAverageConfidence: 88,
  });

  assert.deepEqual(scope.inspections, [spoiledInspection]);
  assert.equal(scope.scopeLabel, "inspections from August 5, 2026");
  assert.equal(scope.reportDayLabel, "August 5, 2026");
  assert.equal(scope.filenameScope, "2026-08-05");
  assert.equal(scope.averageConfidence, 88);
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run from `frontend`:

```powershell
npm exec -- tsx --test tests/unit/domain/analysis/history-report-pdf-export.unit.test.ts tests/unit/hooks/history-page-filter.unit.test.ts
```

Expected: FAIL because `buildHistoryExportScope` does not exist.

- [ ] **Step 3: Implement the minimal scope builder and hook wiring**

Use the existing `avgConfidence`, `selectedDayInspections`, and `selectedDayAverageConfidence` values. In the export callback, use the returned scope for the report model and show:

```ts
if (scope.inspections.length === 0) {
  toast.error(scope.hasSelectedDay ? "No inspections found for the selected day" : "No saved inspections to export");
  return;
}
```

Pass `scope.reportDayLabel` to the existing report model and use `scope.filenameScope` in the downloaded filename. Keep model accuracy history unchanged; an all-record export uses the currently available history array without adding an API request.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run the same command. Expected: PASS with the existing report adapter tests still green.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/widgets/history/model/history-page.ts frontend/src/widgets/history/model/types.ts frontend/src/widgets/history/model/use-history.ts frontend/tests/unit/domain/analysis/history-report-pdf-export.unit.test.ts frontend/tests/unit/hooks/history-page-filter.unit.test.ts
git commit -m "feat: export all history records without a date"
```

### Task 2: Make saved records the primary History task

**Files:**
- Modify: `frontend/src/widgets/history/ui/history-header.tsx`
- Modify: `frontend/src/widgets/history/ui/inspection-timeline-section.tsx`
- Modify: `frontend/src/pages/inspector/history-page.tsx`
- Modify: `frontend/src/entities/inspection/ui/inspection-list-item.tsx`
- Test: `frontend/tests/component/inspections/inspection-list-item.component.test.tsx`
- Test: `frontend/tests/component/history/inspection-timeline-section.component.test.tsx` (create)

**Interfaces:**
- `HistoryHeader` accepts only `totalInspections` and renders `Saved inspections` with a short instruction.
- `InspectionTimelineSection` owns only search, status filtering, record rendering, loading/empty states, and pagination. It no longer owns date or export controls.
- `InspectionListItem` keeps card selection behavior and adds a real button with `data-testid="inspection-open-record"` and accessible name `Open record`.

- [ ] **Step 1: Write the failing tests**

Extend the record component test:

```ts
test("gives each saved inspection an explicit open record action", () => {
  const markup = renderToStaticMarkup(<InspectionListItem inspection={buildInspection()} />);

  assert.match(markup, /data-testid="inspection-open-record"/);
  assert.match(markup, />Open record</);
});
```

Add a timeline component test that renders the existing props and asserts:

```ts
assert.match(markup, /Saved inspections/);
assert.match(markup, /Find a record by meat or place/);
assert.match(markup, /Show results/);
assert.doesNotMatch(markup, /Export PDF/);
```

- [ ] **Step 2: Run the focused tests and verify RED**

```powershell
npm exec -- tsx --test tests/component/inspections/inspection-list-item.component.test.tsx tests/component/history/inspection-timeline-section.component.test.tsx
```

Expected: the new assertions fail because the explicit action and simplified copy do not exist yet.

- [ ] **Step 3: Implement the minimal primary-list UI**

Change the header to a compact title/count/instruction. Replace the six filter buttons with a labeled native select populated from `HISTORY_FILTER_OPTIONS`, retaining the same `FilterOption` values. Change the search placeholder to `Find a record by meat or place` and keep the existing search matching implementation, which also supports location, classification, and ID.

Add a `Button` to each inspection card. Stop propagation from the button and call `onSelect(inspection)` so the card and the named action open the same detail sheet. Preserve the image preview button’s propagation behavior.

Render the page as one primary column: header, timeline, then the future `HistoryMoreOptions` panel. Keep the existing `InspectionDetailSheet` mounted after the list.

- [ ] **Step 4: Run the focused tests and verify GREEN**

```powershell
npm exec -- tsx --test tests/component/inspections/inspection-list-item.component.test.tsx tests/component/history/inspection-timeline-section.component.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/widgets/history/ui/history-header.tsx frontend/src/widgets/history/ui/inspection-timeline-section.tsx frontend/src/pages/inspector/history-page.tsx frontend/src/entities/inspection/ui/inspection-list-item.tsx frontend/tests/component/inspections/inspection-list-item.component.test.tsx frontend/tests/component/history/inspection-timeline-section.component.test.tsx
git commit -m "feat: make saved inspections the history primary task"
```

### Task 3: Move reporting and analytics into More options

**Files:**
- Create: `frontend/src/widgets/history/ui/history-more-options.tsx`
- Modify: `frontend/src/widgets/history/index.ts`
- Modify: `frontend/src/pages/inspector/history-page.tsx`
- Modify: `frontend/src/widgets/history/ui/history-sidebar.tsx`
- Modify: `frontend/src/widgets/history/ui/inspection-timeline-section.tsx`
- Test: `frontend/tests/component/history/history-more-options.component.test.tsx` (create)

**Interfaces:**
- `HistoryMoreOptions` accepts the existing date, export progress, export callback, day-summary, classification-count, and monthly-count values from `useHistory`.
- It renders a native `<details>` section with summary `More options`, an export scope sentence, optional date filter, export button, and the existing analytics cards.

- [ ] **Step 1: Write the failing tests**

Render `HistoryMoreOptions` with no selected date and with a selected date. Assert:

```ts
assert.match(allMarkup, /More options/);
assert.match(allMarkup, /PDF will include all saved inspections/);
assert.match(allMarkup, /Export all inspections as PDF/);
assert.match(dayMarkup, /PDF will include inspections from August 5, 2026/);
assert.match(dayMarkup, /Export this day as PDF/);
```

Also assert the existing classification and monthly summary labels remain available inside the expanded content.

- [ ] **Step 2: Run the focused test and verify RED**

```powershell
npm exec -- tsx --test tests/component/history/history-more-options.component.test.tsx
```

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the secondary options panel**

Use a native `<details>` element so the panel is keyboard accessible without adding state. Put date input, clear action, scope helper text, and export button at the top. Use the exact copy:

```tsx
{hasValidReportDay
  ? `PDF will include inspections from ${formattedReportDayLabel}.`
  : "PDF will include all saved inspections. Choose a date to export one day."}
```

Button text must be `Export all inspections as PDF` without a date and `Export this day as PDF` with a valid date. Keep the existing loading overlay around the options panel and render `HistorySidebar`’s analytics content beneath the export controls. Remove date/export controls from `InspectionTimelineSection`.

- [ ] **Step 4: Wire the panel into the page and verify GREEN**

Pass the existing `useHistory` values from `HistoryPage` to `HistoryMoreOptions`. Export the new component from the widget API, retain `HistorySidebar`’s public export, and run:

```powershell
npm exec -- tsx --test tests/component/history/history-more-options.component.test.tsx tests/unit/widgets/history/history-public-api.unit.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/widgets/history/ui/history-more-options.tsx frontend/src/widgets/history/index.ts frontend/src/pages/inspector/history-page.tsx frontend/src/widgets/history/ui/history-sidebar.tsx frontend/src/widgets/history/ui/inspection-timeline-section.tsx frontend/tests/component/history/history-more-options.component.test.tsx
git commit -m "feat: tuck history reporting tools into more options"
```

### Task 4: Put saved result and dispute action first in record details

**Files:**
- Modify: `frontend/src/widgets/inspection-history/ui/inspection-detail-sheet.tsx`
- Test: `frontend/tests/component/inspection-history/inspection-detail-sheet.component.test.tsx` (create)

**Interfaces:**
- Preserve `InspectionDetailSheetProps` and every existing dispute hook interaction.
- Add stable semantic markers for the leading result summary and dispute action so the user-facing priority is testable.

- [ ] **Step 1: Write the failing test**

Add a source-level/component-safe assertion for the rendered structure and copy:

```ts
assert.match(source, /data-testid="inspection-detail-summary"/);
assert.match(source, />Result</);
assert.match(source, /data-testid="inspection-detail-dispute"/);
```

The test should also assert that `Dispute result` appears before the `Pre-Scan Safety Protocol` section in the source, proving it is not buried after every technical detail.

- [ ] **Step 2: Run the focused test and verify RED**

```powershell
npm exec -- tsx --test tests/component/inspection-history/inspection-detail-sheet.component.test.tsx
```

Expected: FAIL because the markers and leading summary structure do not exist.

- [ ] **Step 3: Implement the minimal detail hierarchy change**

Move or extract the existing classification/confidence banner and the dispute section so the dialog order is: title, result/confidence summary, key date/location details, dispute action, image, then technical protocol/analysis/deviation/note sections. Rename only primary labels to `Result`, `Confidence`, `When`, and `Where`; keep detailed content and submission behavior unchanged. Add the test IDs to the summary and dispute section.

- [ ] **Step 4: Run the focused test and verify GREEN**

```powershell
npm exec -- tsx --test tests/component/inspection-history/inspection-detail-sheet.component.test.tsx tests/unit/widgets/inspection-history/inspection-detail-scope.unit.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/widgets/inspection-history/ui/inspection-detail-sheet.tsx frontend/tests/component/inspection-history/inspection-detail-sheet.component.test.tsx
git commit -m "feat: surface history result and dispute action"
```

### Task 5: Align the History tutorial with the simplified flow

**Files:**
- Modify: `frontend/src/features/tutorials/model/inspection-tutorial.ts`
- Modify: `frontend/src/features/tutorials/ui/scenes/history-mock-scene.tsx`
- Modify: `frontend/tests/component/tutorials/history-mock-scene.component.test.tsx`
- Modify: `frontend/tests/component/tutorials/tutorial-scene-registry.component.test.tsx`

**Interfaces:**
- Keep the three existing History tutorial step IDs so stored progress and routing remain stable: `history-open-record`, `history-review-details`, and `history-back-to-list`.
- Update the scene and copy to use `Saved inspections`, `Find a record by meat or place`, `Open record`, `Result`, `Confidence`, and `Dispute result`.

- [ ] **Step 1: Write the failing tests**

Update the History scene test to assert the new primary flow:

```ts
assert.match(markup, /Saved inspections/);
assert.match(markup, /Find a record by meat or place/);
assert.match(markup, /Open record/);
```

For the detail step, assert `Result`, `Confidence`, and `Dispute result`. Keep the registry assertion that every History step renders.

- [ ] **Step 2: Run the focused tutorial tests and verify RED**

```powershell
npm exec -- tsx --test tests/component/tutorials/history-mock-scene.component.test.tsx tests/component/tutorials/tutorial-scene-registry.component.test.tsx
```

Expected: FAIL because the current mock still presents the old dense wording and does not show the explicit action/dispute affordance.

- [ ] **Step 3: Implement the tutorial update**

Keep the same fixture values. In the list scene, show a compact saved-inspections heading, search placeholder, a simple status control, and an explicit `Open record` hotspot around the record action. In the detail scene, show the leading result/confidence summary and a visible `Dispute result` action while preserving the back hotspot. Update instructions and block descriptions to match the live flow.

- [ ] **Step 4: Run the focused tutorial tests and verify GREEN**

```powershell
npm exec -- tsx --test tests/component/tutorials/history-mock-scene.component.test.tsx tests/component/tutorials/tutorial-scene-registry.component.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/features/tutorials/model/inspection-tutorial.ts frontend/src/features/tutorials/ui/scenes/history-mock-scene.tsx frontend/tests/component/tutorials/history-mock-scene.component.test.tsx frontend/tests/component/tutorials/tutorial-scene-registry.component.test.tsx
git commit -m "feat: align history tutorial with simplified flow"
```

### Task 6: Run the frontend quality gates

**Files:**
- No production edits; verification only.

- [ ] **Step 1: Run all focused History and tutorial tests**

```powershell
npm exec -- tsx --test tests/unit/domain/analysis/history-report-pdf-export.unit.test.ts tests/unit/hooks/history-page-filter.unit.test.ts tests/unit/widgets/history/history-public-api.unit.test.ts tests/unit/widgets/inspection-history/inspection-detail-scope.unit.test.ts tests/component/inspections/inspection-list-item.component.test.tsx tests/component/history/inspection-timeline-section.component.test.tsx tests/component/history/history-more-options.component.test.tsx tests/component/inspection-history/inspection-detail-sheet.component.test.tsx tests/component/tutorials/history-mock-scene.component.test.tsx tests/component/tutorials/tutorial-scene-registry.component.test.tsx
```

Expected: all listed tests pass.

- [ ] **Step 2: Run frontend typecheck**

```powershell
npm run typecheck -w frontend
```

Expected: exit code 0.

- [ ] **Step 3: Run frontend lint**

```powershell
npm run lint -w frontend
```

Expected: exit code 0 with no new errors.

- [ ] **Step 4: Run the frontend production build**

```powershell
npm run build:frontend
```

Expected: exit code 0; existing non-blocking bundle/browser warnings may remain.

- [ ] **Step 5: Check the diff and working tree**

```powershell
git diff --check origin/master..HEAD
git status --short
```

Expected: no whitespace errors and only the intended commits/files. Remote push remains the user’s choice.
