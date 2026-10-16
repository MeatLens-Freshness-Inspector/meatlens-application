# History Progressive Disclosure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the inspector-facing History tab's default visual load while keeping record lookup, documentation photos, export, offline data, and tutorial guidance accessible.

**Architecture:** Keep data and export calculations in `useHistory` unchanged. Add local disclosure state to the timeline filter, documentation-photo section, and report-summary section, and update the tutorial mock/copy to mirror those states.

**Tech Stack:** React, TypeScript, Tailwind CSS, Node test runner through `tsx`, Playwright.

## Global Constraints

- Do not modify backend routes, database schemas, inspection payloads, documentation-photo payloads, or PDF generation.
- Keep the admin dashboard unchanged.
- Keep the main search field and PDF export visible by default.
- Use native disclosure buttons with `aria-expanded` and `aria-controls`.
- Preserve touch-safe behavior at 300-350px widths and existing offline cache behavior.
- Write the failing test before each production behavior change and run focused checks before broader verification.
- Stage only files belonging to this History/tutorial task; preserve the two unrelated backend edits.

---

### Task 1: Keep record search visible and collapse secondary status filters

**Files:**
- Modify: `frontend/src/widgets/history/ui/inspection-timeline-section.tsx`
- Test: `frontend/tests/component/history/inspection-timeline-section.component.test.tsx`

**Interfaces:**
- Consumes the existing `activeFilter`, `searchText`, and `onActiveFilterChange` props.
- Produces the existing search/filter behavior plus a local `Filter results` disclosure; no model or API changes.

- [ ] **Step 1: Write the failing component assertion**

Update the existing static-markup test to require the visible label `Find a saved record`, require `Filter results`, and require that `id="inspection-status"` is absent in the default render. Keep assertions for `Saved inspections`, `Show results` semantics through the expanded-state E2E test, and no `Export PDF` in this component.

- [ ] **Step 2: Run the timeline component test to verify it fails**

Run:

```powershell
npx tsx --test tests/component/history/inspection-timeline-section.component.test.tsx
```

Expected: the new default-collapsed assertion fails because the status select is currently rendered immediately.

- [ ] **Step 3: Implement the minimal disclosure behavior**

In `InspectionTimelineSection`, import `useState` and `ChevronDown`/`ChevronUp`. Keep the search input visible with a visible `Find a saved record` label. Add a local `isFilterExpanded` state initialized to `false`, render a native button labeled `Filter results`/`Hide filters` with `aria-expanded` and `aria-controls="history-filter-controls"`, and render the existing `Show results` select only when expanded. Include the selected non-default status in the button's supporting text without changing the option values or callback.

- [ ] **Step 4: Run the timeline test to verify it passes**

Run the same command. Expected: all timeline component tests pass.

- [ ] **Step 5: Commit the focused change**

```powershell
git add frontend/src/widgets/history/ui/inspection-timeline-section.tsx frontend/tests/component/history/inspection-timeline-section.component.test.tsx
git commit -m "feat: collapse history status filters"
```

### Task 2: Collapse documentation-photo cards until requested

**Files:**
- Modify: `frontend/src/widgets/history/ui/documentation-photo-section.tsx`
- Test: `frontend/tests/component/history/documentation-photo-section.component.test.tsx`
- Update verification: `frontend/tests/e2e/journeys/inspector/use-inspections.e2e.spec.ts`

**Interfaces:**
- Consumes the existing saved and pending documentation-photo arrays.
- Produces the same photo cards/details/lightbox after expansion, with no change to photo data or sync behavior.

- [ ] **Step 1: Add a failing default-collapsed component test**

Create a static-markup test with one valid `DocumentationPhoto`, `pendingPhotos={[]}`, and assertions that `Documentation photos` and `Show documentation photos` render while `data-testid="documentation-photo-card-layout"` does not.

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
npx tsx --test tests/component/history/documentation-photo-section.component.test.tsx
```

Expected: the test fails because the first documentation card is currently rendered by default.

- [ ] **Step 3: Implement the collapsed default**

Change `visibleEntries` so the default collapsed state renders no entries and the expanded state renders all entries. Keep the section in the same page position, preserve the existing button's `aria-expanded`, rename its collapsed label to `Show documentation photos`, and use `Hide documentation photos` when expanded. Keep the empty-state message unchanged when there are no entries.

- [ ] **Step 4: Update and run the narrow-card E2E flow**

In `use-inspections.e2e.spec.ts`, assert that the documentation card is absent initially, click `Show documentation photos`, then assert the card and its `View details` action are visible before running the existing 300/340/350px containment checks.

Run:

```powershell
npx tsx --test tests/component/history/documentation-photo-section.component.test.tsx
npx playwright test tests/e2e/journeys/inspector/use-inspections.e2e.spec.ts --grep "documentation photo actions" --reporter=line
```

Expected: focused component and E2E tests pass.

- [ ] **Step 5: Commit the focused change**

```powershell
git add frontend/src/widgets/history/ui/documentation-photo-section.tsx frontend/tests/component/history/documentation-photo-section.component.test.tsx frontend/tests/e2e/journeys/inspector/use-inspections.e2e.spec.ts
git commit -m "feat: collapse history documentation photos"
```

### Task 3: Keep export visible and collapse totals/trends

**Files:**
- Modify: `frontend/src/widgets/history/ui/history-more-options.tsx`
- Test: `frontend/tests/component/history/history-more-options.component.test.tsx`

**Interfaces:**
- Consumes the existing report-date, export-progress, classification-count, and monthly-count props.
- Produces the same export callback and report scope behavior, with a local summary disclosure around `HistorySidebar`.

- [ ] **Step 1: Update the component tests for the desired default**

Change the no-date test to require `Export a report`, `Without a date, this includes all saved inspections`, and `Show totals and trends`, while asserting `Classification Mix` and `Recent Activity by Month` are absent by default. Keep the selected-date test focused on its date-specific explanatory copy and export label.

- [ ] **Step 2: Run the tests to verify the new expectation fails**

Run:

```powershell
npx tsx --test tests/component/history/history-more-options.component.test.tsx
```

Expected: the default test fails because `HistorySidebar` is currently rendered immediately.

- [ ] **Step 3: Implement the summary disclosure**

Import `useState` and `ChevronDown`/`ChevronUp`, initialize `isSummaryExpanded` to `false`, keep the export section unchanged and visible, and wrap the existing totals heading plus `HistorySidebar` in a conditional `history-summary-controls` region. Add a native button labeled `Show totals and trends`/`Hide totals and trends` with `aria-expanded` and `aria-controls`.

- [ ] **Step 4: Run the component tests to verify they pass**

Run the same command. Expected: both export/report tests pass.

- [ ] **Step 5: Commit the focused change**

```powershell
git add frontend/src/widgets/history/ui/history-more-options.tsx frontend/tests/component/history/history-more-options.component.test.tsx
git commit -m "feat: collapse history totals and trends"
```

### Task 4: Update History tutorial and verify the complete focused journey

**Files:**
- Modify: `frontend/src/features/tutorials/ui/scenes/history-mock-scene.tsx`
- Modify: `frontend/src/features/tutorials/model/inspection-tutorial.ts`
- Test: `frontend/tests/component/tutorials/history-mock-scene.component.test.tsx`
- Create: `frontend/tests/e2e/journeys/inspector/history-progressive-disclosure.e2e.spec.ts`

**Interfaces:**
- Consumes the existing tutorial fixture and step definitions.
- Produces tutorial copy and mock states that show visible search, collapsed filters/documentation/totals, and clear all-record export.

- [ ] **Step 1: Add failing tutorial assertions and the focused E2E journey**

Update the tutorial component test to require `Find a saved record`, `Filter results`, `Show documentation photos`, and `Show totals and trends`, and to assert the old always-visible `Inspection totals` content is absent from the default list scene. Add an E2E test that signs in, opens `/history` at 340px, verifies the default collapsed state, expands filters and totals, and verifies the no-date export button remains labeled `Export all inspections as PDF`.

- [ ] **Step 2: Run the tutorial/E2E checks to verify they fail**

Run:

```powershell
npx tsx --test tests/component/tutorials/history-mock-scene.component.test.tsx
npx playwright test tests/e2e/journeys/inspector/history-progressive-disclosure.e2e.spec.ts --reporter=line
```

Expected: the new assertions fail because the tutorial currently renders the old dense list state and the E2E file does not yet have the new behavior.

- [ ] **Step 3: Update the tutorial mock and copy**

Make the History mock show the same visible search label, `Filter results` disclosure, collapsed documentation-photo section, and collapsed `Show totals and trends` control. Keep the existing Open record, detail review, dispute, and export hotspots. Update the History step instructions so they describe the collapsed secondary sections and the no-date all-record export.

- [ ] **Step 4: Run the complete focused verification**

Run:

```powershell
npx tsx --test tests/component/history/inspection-timeline-section.component.test.tsx tests/component/history/documentation-photo-section.component.test.tsx tests/component/history/history-more-options.component.test.tsx tests/component/tutorials/history-mock-scene.component.test.tsx
npx playwright test tests/e2e/journeys/inspector/history-progressive-disclosure.e2e.spec.ts tests/e2e/journeys/inspector/use-inspections.e2e.spec.ts --grep "progressive disclosure|documentation photo actions" --reporter=line
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

Expected: all focused tests pass, typecheck/build pass, lint exits successfully with only existing warnings if present, and `git diff --check` reports no whitespace errors.

- [ ] **Step 5: Commit the tutorial and journey coverage**

```powershell
git add frontend/src/features/tutorials/ui/scenes/history-mock-scene.tsx frontend/src/features/tutorials/model/inspection-tutorial.ts frontend/tests/component/tutorials/history-mock-scene.component.test.tsx frontend/tests/e2e/journeys/inspector/history-progressive-disclosure.e2e.spec.ts
git commit -m "docs: align history tutorial with simplified flow"
```

## Completion checklist

- [ ] Four focused implementation commits exist.
- [ ] No backend or database files are staged.
- [ ] The existing admin dashboard is unchanged.
- [ ] Focused tests, E2E, typecheck, lint, build, and diff checks have fresh passing output.
