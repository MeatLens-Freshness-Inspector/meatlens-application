# Regulatory Compliance Radio Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three pre-scan regulatory Yes/No selects with large, accessible responsive radio options that are easy for meat inspectors to click without changing inspection data or validation behavior.

**Architecture:** Keep the existing `InspectPreScanSection` component and `InspectionPreScanForm` data contract. Extract the repeated Yes/No presentation into a local radio-field helper backed by the existing Radix radio-group primitives, using a mobile-first one-column layout that becomes two equal columns at the `sm` breakpoint. Update the affected Playwright helpers to interact through accessible radio roles and add component coverage for the rendered groups, options, and responsive classes.

**Tech Stack:** React 18, TypeScript, Radix UI Radio Group, Tailwind CSS, Node test runner with `tsx`, Playwright.

## Global Constraints

- Preserve the existing `InspectionPreScanForm` values (`"" | "yes" | "no"`) and `onFieldChange` callback contract.
- Preserve completion, protocol-failure, bypass, lock, and conditional `What Color?` behavior.
- On mobile, render each Yes/No group as one column with two rows; from `sm` upward, render one row with two equal columns.
- Make the whole option surface clickable, with a generous minimum height, visible selected/focus states, and disabled styling.
- Keep all existing tests and update selectors rather than weakening coverage.
- Run the relevant local CI checks before claiming completion.

---

### Task 1: Add failing component coverage for the radio-field contract

**Files:**
- Create: `frontend/tests/component/inspection-workspace/inspect-pre-scan-section.component.test.tsx`
- Read: `frontend/src/widgets/inspection-workspace/ui/InspectPreScanSection.tsx`
- Read: `frontend/src/entities/inspection/model/pre-scan.ts`

**Interfaces:**
- Consumes: `InspectPreScanSection` props and `InspectionPreScanForm`.
- Produces: regression coverage requiring three named radio groups, six Yes/No radio options, responsive option-grid classes, and preserved conditional copy.

- [ ] **Step 1: Write the failing component test**

Create a test fixture with complete pre-scan values and render `InspectPreScanSection` using `renderToStaticMarkup`. Assert that the markup contains the three question labels, three `role="radiogroup"` containers, six `role="radio"` controls, all three Yes and all three No labels, and the mobile-first/desktop responsive grid class markers (`grid-cols-1` and `sm:grid-cols-2`). Also render `lightColorCorrect: "no"` with a non-empty observed color and assert that `What Color?` remains present.

Use the existing Node test style:

```tsx
import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { InspectPreScanSection } from "../../../src/widgets/inspection-workspace/ui/InspectPreScanSection";
import type { InspectionPreScanForm } from "../../../src/entities/inspection";

Object.assign(globalThis, { React });

const form: InspectionPreScanForm = {
  stallNumber: "12-A",
  meatInspectionCertificateProof: "CERT-77",
  meatExpiryDate: "2099-12-31",
  storageCorrect: "yes",
  lightColorCorrect: "no",
  lightColorObserved: "green",
  areaClean: "yes",
};

test("renders large responsive radio choices for all regulatory questions", () => {
  const markup = renderToStaticMarkup(
    <InspectPreScanSection
      form={form}
      isBypassed={false}
      isChecklistComplete={false}
      isLocked={false}
      onFieldChange={() => undefined}
    />,
  );

  for (const label of ["Storage Correct", "Light Color Correct", "Area Clean"]) {
    assert.match(markup, new RegExp(label));
  }
  assert.equal((markup.match(/role="radiogroup"/g) ?? []).length, 3);
  assert.equal((markup.match(/role="radio"/g) ?? []).length, 6);
  assert.equal((markup.match(/>Yes<[^>]*>/g) ?? []).length, 3);
  assert.equal((markup.match(/>No<[^>]*>/g) ?? []).length, 3);
  assert.match(markup, /grid-cols-1/);
  assert.match(markup, /sm:grid-cols-2/);
  assert.match(markup, /What Color\?/);
});
```

- [ ] **Step 2: Run the focused component test and verify it fails**

Run from the repository root:

```powershell
npm run test:component -w frontend -- --test-name-pattern="large responsive radio choices"
```

Expected: FAIL because the current component renders native `select` elements and no radio groups.

- [ ] **Step 3: Commit the failing test**

```powershell
git add -- frontend/tests/component/inspection-workspace/inspect-pre-scan-section.component.test.tsx
git commit -m "test: cover regulatory compliance radio controls"
```

### Task 2: Replace the three selects with responsive, fully clickable radio options

**Files:**
- Modify: `frontend/src/widgets/inspection-workspace/ui/InspectPreScanSection.tsx`
- Read: `frontend/src/shared/ui/radio-group.tsx`
- Read: `frontend/src/shared/lib/utils.ts`

**Interfaces:**
- Consumes: Existing `InspectPreScanSectionProps`, `InspectionPreScanForm`, `RadioGroup`, `RadioGroupItem`, and `cn` utility.
- Produces: A local `RadioField` helper that accepts the same field/value/disabled/change inputs and emits the existing `"yes"`/`"no"` values through `onFieldChange`.

- [ ] **Step 1: Replace the select helper with a radio helper**

Import `RadioGroup` and `RadioGroupItem` from `@/shared/ui/radio-group` and `cn` from `@/shared/lib/utils`. Replace `SelectField` with a `RadioField` that:

1. Uses a `fieldset` and `legend` for the question label.
2. Renders a `RadioGroup` with `value`, `disabled`, and `onValueChange` wired to the same form field callback.
3. Uses `className="grid grid-cols-1 gap-2 sm:grid-cols-2"` so each group is two rows on mobile and one row with two columns at `sm` and larger widths.
4. Renders Yes and No as labels with `min-h-12 flex-1`, `px-4 py-3`, `touch-manipulation`, cursor/focus styling, and selected styling based on the current field value.
5. Gives each item an id of `${field}-${option.value}` and an accessible label of `${label}: ${option.label}`.
6. Keeps disabled behavior tied to `areInputsDisabled`.

Use the existing `cn` helper for selected/unselected classes; do not change the form model or validation logic. Replace only the three `SelectField` usages with `RadioField` usages.

- [ ] **Step 2: Run the focused component test and verify it passes**

Run:

```powershell
npm run test:component -w frontend -- --test-name-pattern="large responsive radio choices"
```

Expected: PASS with the three radiogroups, six radio items, responsive classes, and conditional `What Color?` assertion present.

- [ ] **Step 3: Run focused static checks for the component**

Run:

```powershell
npm run typecheck -w frontend
npm run lint -w frontend -- --quiet
```

Expected: both commands exit 0. If lint reports pre-existing non-error warnings without `--quiet`, record them but do not weaken lint configuration.

- [ ] **Step 4: Commit the component implementation**

```powershell
git add -- frontend/src/widgets/inspection-workspace/ui/InspectPreScanSection.tsx
git commit -m "feat: use responsive radio controls for compliance checks"
```

### Task 3: Update E2E interactions to use accessible radio controls

**Files:**
- Modify: `frontend/tests/e2e/offline/offline-analysis.e2e.spec.ts`
- Modify: `frontend/tests/e2e/journeys/inspector/camera-quality.e2e.spec.ts`
- Modify: `frontend/tests/e2e/journeys/inspector/camera-capture.e2e.spec.ts`
- Modify: `frontend/tests/e2e/journeys/inspector/inspect-page.e2e.spec.ts`

**Interfaces:**
- Consumes: The stable radio accessible names `${question}: Yes` and `${question}: No` from Task 2.
- Produces: E2E coverage that continues exercising successful pre-scan completion and failed-protocol/observed-light-color flows through the new UI.

- [ ] **Step 1: Replace each compliance `selectOption` call**

Change only the three compliance selectors in each pre-scan helper/flow from:

```ts
await page.getByLabel(/storage correct/i).selectOption("yes");
await page.getByLabel(/light color correct/i).selectOption("yes");
await page.getByLabel(/area clean/i).selectOption("yes");
```

to:

```ts
await page.getByRole("radio", { name: "Storage Correct: Yes" }).click();
await page.getByRole("radio", { name: "Light Color Correct: Yes" }).click();
await page.getByRole("radio", { name: "Area Clean: Yes" }).click();
```

For the failed light-color flow, use `Light Color Correct: No` and keep the existing `What Color?` fill unchanged. Do not alter unrelated camera-control selects such as focus mode.

- [ ] **Step 2: Run the affected E2E specs**

Run:

```powershell
npm run test:e2e -w frontend -- tests/e2e/offline/offline-analysis.e2e.spec.ts tests/e2e/journeys/inspector/inspect-page.e2e.spec.ts tests/e2e/journeys/inspector/camera-capture.e2e.spec.ts tests/e2e/journeys/inspector/camera-quality.e2e.spec.ts
```

Expected: all tests in the four affected files pass, including the failed pre-scan path and the camera flows. If Playwright modifies the tracked report artifact, restore only that generated artifact before committing.

- [ ] **Step 3: Commit the E2E selector updates**

```powershell
git add -- frontend/tests/e2e/offline/offline-analysis.e2e.spec.ts frontend/tests/e2e/journeys/inspector/inspect-page.e2e.spec.ts frontend/tests/e2e/journeys/inspector/camera-capture.e2e.spec.ts frontend/tests/e2e/journeys/inspector/camera-quality.e2e.spec.ts
git commit -m "test: update inspector flows for compliance radios"
```

### Task 4: Run the complete affected CI-equivalent verification

**Files:**
- Modify: none unless a verification failure identifies a root-cause defect.

**Interfaces:**
- Consumes: Tasks 1-3 committed changes.
- Produces: Fresh verification evidence for frontend quality gates and the repository test suite.

- [ ] **Step 1: Run frontend unit, component, integration, architecture, lint, typecheck, and build checks**

Run:

```powershell
npm run test:unit -w frontend
npm run test:component -w frontend
npm run test:integration -w frontend
npm run test:architecture -w frontend
npm run lint -w frontend
npm run typecheck -w frontend
npm run build -w frontend
```

Expected: every command exits 0. Preserve any existing lint warnings and investigate any new error or warning introduced by this change.

- [ ] **Step 2: Run the repository’s full fast gate**

Run:

```powershell
npm run test:fast
```

Expected: all frontend and backend fast suites pass without skipped or focused tests.

- [ ] **Step 3: Inspect the final diff and working tree**

Run:

```powershell
git diff HEAD~3..HEAD --stat
git status --short
git log -4 --oneline
```

Expected: only the design/plan documentation, pre-scan component, new component test, and four affected E2E files are changed; no generated report or unrelated user changes remain.

- [ ] **Step 4: Report verification evidence**

Summarize the responsive interaction, the preserved behavior, the exact checks run, and any remote CI status. Do not claim completion if a required local gate failed or remote CI is still unverified.
