# Inspect Page Progressive Disclosure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the number of simultaneous inspect-page controls for phone-first inspectors while preserving required safety data, capture, analysis, save, dispute, and offline behavior.

**Architecture:** Keep the existing inspect-page composition and state model. Add local disclosure state only to the pre-scan, camera-settings, and scope-reminder UI components; make the page conditionally render empty/follow-up sections based on existing `result` and `savedInspectionId` state. No new API, persistence, or domain state is introduced.

**Tech Stack:** React, Tailwind CSS utility classes, Lucide icons, Node test runner, Playwright, TypeScript, ESLint.

## Global Constraints

- Keep all required pre-scan fields and safety answers unchanged.
- Keep the scope reminder in its current inspect-page position, collapsed by default.
- Preserve inspection capture, image upload, analysis, save, queue, and sync behavior.
- Do not change backend routes, database schema, inspection payloads, PDF output, or admin-dashboard UI.
- Do not remove the secondary `Take photo only` mode or dispute functionality after a saved result.

---

### Task 1: Make the pre-scan protocol progressive

**Files:**
- Modify: `frontend/src/widgets/inspection-workspace/ui/InspectPreScanSection.tsx`
- Test: `frontend/tests/component/inspection-workspace/inspect-pre-scan-section.component.test.tsx`
- Test: `frontend/tests/e2e/offline/offline-analysis.e2e.spec.ts`

**Interfaces:**
- Consumes: existing `form`, `isChecklistComplete`, `isBypassed`, `isLocked`, and `onFieldChange` props.
- Produces: the same pre-scan fields, with incomplete forms expanded and completed forms reviewable behind an accessible toggle.

- [ ] **Step 1: Write the failing component assertions**

Extend the component test so a complete form renders a review toggle and hides the detailed inputs by default:

```tsx
test("collapses completed pre-scan details behind a review control", () => {
  const markup = renderToStaticMarkup(
    <InspectPreScanSection
      form={form}
      isBypassed={false}
      isChecklistComplete={true}
      isLocked={false}
      onFieldChange={() => undefined}
    />,
  );

  assert.match(markup, /Review checklist/);
  assert.match(markup, /aria-expanded="false"/);
  assert.doesNotMatch(markup, /id="stall-number"/);
});

test("keeps incomplete pre-scan details open", () => {
  const markup = renderToStaticMarkup(
    <InspectPreScanSection
      form={{ ...form, stallNumber: "" }}
      isBypassed={false}
      isChecklistComplete={false}
      isLocked={false}
      onFieldChange={() => undefined}
    />,
  );

  assert.doesNotMatch(markup, /Review checklist/);
  assert.match(markup, /id="stall-number"/);
});
```

- [ ] **Step 2: Run the new component assertions and verify the expected failure**

Run from `frontend/`:

```bash
npx tsx --test tests/component/inspection-workspace/inspect-pre-scan-section.component.test.tsx
```

Expected: the complete-form test fails because the current component always renders the detailed fields and has no review toggle.

- [ ] **Step 3: Implement the disclosure state**

Add `useEffect` and `useState`, plus `ChevronDown`/`ChevronUp` imports. Initialize `isExpanded` from `!isChecklistComplete`, then synchronize it when completeness changes:

```tsx
const [isExpanded, setIsExpanded] = useState(!isChecklistComplete);

useEffect(() => {
  setIsExpanded(!isChecklistComplete);
}, [isChecklistComplete]);
```

Keep the section header and status badge visible. Add a toggle only when the checklist is complete or bypassed:

```tsx
{(isChecklistComplete || isBypassed) && (
  <button
    type="button"
    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-border/70 bg-background/55 px-3 text-xs font-medium"
    aria-controls="inspect-pre-scan-fields"
    aria-expanded={isExpanded}
    onClick={() => setIsExpanded((expanded) => !expanded)}
  >
    {isExpanded ? "Hide checklist" : "Review checklist"}
    {isExpanded ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
  </button>
)}
```

Wrap the existing bypass message and the existing input grid in a single conditional container with `id="inspect-pre-scan-fields"` and `className="mt-4"`:

```tsx
{isExpanded && (
  <div id="inspect-pre-scan-fields" className="mt-4">
    {isBypassed && (
      <div className="rounded-2xl border border-warning/30 bg-[hsl(var(--warning)/0.08)] px-4 py-3 text-xs text-foreground">
        Developer bypass active. Pre-scan answers are optional for this session.
      </div>
    )}
    <div className={cn(isBypassed ? "mt-4" : undefined, "grid gap-4 lg:grid-cols-2")}>
      {/* Keep the existing Stall Number, certificate, expiry, and radio-field JSX unchanged here. */}
    </div>
  </div>
)}
```

Keep the expired-certificate alert visible whenever it applies, so a safety warning is not hidden by disclosure. Do not change field names, values, disabled rules, radio options, or validation.

- [ ] **Step 4: Run the component tests and offline regression**

Run:

```bash
npx tsx --test tests/component/inspection-workspace/inspect-pre-scan-section.component.test.tsx
npx playwright test tests/e2e/offline/offline-analysis.e2e.spec.ts --grep "offline protocol failure" --reporter=line
```

Expected: both pre-scan component tests pass and the protocol-failure flow still queues the same complete payload.

### Task 2: Hide advanced camera controls behind a settings disclosure

**Files:**
- Modify: `frontend/src/features/inspection-capture/ui/camera-capture-view.tsx`
- Test: `frontend/tests/integration/camera/camera-quality.integration.test.tsx`

**Interfaces:**
- Consumes: existing camera capability props and control callbacks.
- Produces: the same flash/focus/brightness/exposure/aperture/zoom controls, revealed only after tapping `Camera settings`.

- [ ] **Step 1: Write the failing default-visibility assertion**

Add a streaming-camera case to the integration test using `buildProps`:

```tsx
test("keeps advanced camera controls collapsed until requested", () => {
  const markup = renderToStaticMarkup(
    <CameraCaptureView
      {...buildProps({
        capturedImage: null,
        isStreaming: true,
        isVideoReady: true,
        torchSupported: true,
      })}
    />,
  );

  assert.match(markup, /Camera settings/);
  assert.match(markup, /aria-expanded="false"/);
  assert.doesNotMatch(markup, /Flash Off/);
});
```

- [ ] **Step 2: Run the camera integration test and verify the expected failure**

Run from `frontend/`:

```bash
npx tsx --test tests/integration/camera/camera-quality.integration.test.tsx
```

Expected: the new test fails because the current component renders `Camera Controls` and its flash/manual controls immediately.

- [ ] **Step 3: Implement local camera-settings disclosure**

Import `useEffect` and `useState` from React and add:

```tsx
const [isCameraSettingsOpen, setIsCameraSettingsOpen] = useState(false);
const hasCameraSettings = torchSupported || hasManualControlSupport;

useEffect(() => {
  if (!isStreaming || !isVideoReady) setIsCameraSettingsOpen(false);
}, [isStreaming, isVideoReady]);
```

Replace the always-visible controls panel with a panel that renders only when `isStreaming && isVideoReady && hasCameraSettings`. Its first row is a full-width button labeled `Camera settings`, with `aria-expanded`, `aria-controls="camera-settings-panel"`, and a chevron. Move the current `Camera Controls` heading row, flash button, manual-control grid, and hardware-support message into the conditional `isCameraSettingsOpen` branch without changing any callback, input label, range, capability check, or message text.

- [ ] **Step 4: Run the camera integration tests**

Run:

```bash
npx tsx --test tests/integration/camera/camera-quality.integration.test.tsx
```

Expected: all camera quality tests pass, including the new collapsed-controls assertion.

### Task 3: Reduce duplicate and premature inspect-page sections

**Files:**
- Modify: `frontend/src/widgets/inspection-workspace/ui/InspectCaptureSection.tsx`
- Modify: `frontend/src/widgets/inspection-workspace/ui/inspection-workspace.tsx`
- Test: `frontend/tests/component/inspection-workspace/inspect-capture-section.component.test.tsx`
- Test: `frontend/tests/e2e/offline/offline-analysis.e2e.spec.ts`

**Interfaces:**
- Consumes: existing inspect-page view-model values and action callbacks.
- Produces: one location selector, no empty analysis card before a result, and dispute UI only after a saved inspection ID.

- [ ] **Step 1: Write the failing assertions**

Add to the capture-section component test:

```tsx
test("does not repeat the saved location line", () => {
  const markup = renderToStaticMarkup(
    <InspectCaptureSection
      selectedLocation="Old Market"
      locationDisplayLabel="Old Market"
      coordinateStatusText={null}
      marketLocations={["Old Market", "New Market"]}
      isPreScanChecklistComplete={true}
      isLocationSelectionDisabled={false}
      isCaptureDisabled={false}
      isCaptureCommitted={false}
      isAnalyzeBlockedByModel={false}
      isAnalyzing={false}
      isAnalysisPending={false}
      isDebugFileUploadEnabled={false}
      isInAppCameraEnabled={false}
      showModelInputPreview={false}
      disableRoiSegmentation={false}
      captureResetKey={0}
      onSelectedLocationChange={() => undefined}
      onCapture={() => undefined}
    />,
  );

  assert.doesNotMatch(markup, /Saved to report:/);
});
```

Add to the offline E2E flow immediately after opening `/inspect` and before completing the checklist:

```ts
await expect(page.getByRole("heading", { name: "Analysis Output" })).toHaveCount(0);
await expect(page.getByText(/Dispute result/i)).toHaveCount(0);
```

- [ ] **Step 2: Run the focused tests and verify the expected failures**

Run:

```bash
npx tsx --test tests/component/inspection-workspace/inspect-capture-section.component.test.tsx
npx playwright test tests/e2e/offline/offline-analysis.e2e.spec.ts --grep "online analysis uses MobileNetV3" --reporter=line
```

Expected: the duplicate-location assertion fails first; the E2E assertions also expose the current empty analysis/dispute sections.

- [ ] **Step 3: Remove duplicate and conditionalize sections**

Delete only the paragraph whose rendered text begins with `Saved to report:` from `InspectCaptureSection`.

In `InspectPageView`, define:

```tsx
const showAnalysisOutput = Boolean(inspectPage.result) && !inspectPage.isPhotoOnlyMode;
```

Use `showAnalysisOutput ? "lg:grid-cols-[1.05fr_0.95fr]" : "lg:grid-cols-1"` for the capture grid, render `InspectAnalysisSection` only when `showAnalysisOutput`, and render `InspectionDisputeSection` only when `inspectPage.savedInspectionId` is truthy. Keep all existing props and handlers when those sections are rendered.

- [ ] **Step 4: Run the focused tests and offline capture flow**

Run:

```bash
npx tsx --test tests/component/inspection-workspace/inspect-capture-section.component.test.tsx
npx playwright test tests/e2e/offline/offline-analysis.e2e.spec.ts --grep "online analysis uses MobileNetV3|offline protocol failure" --reporter=line
```

Expected: initial inspect state has only the capture workflow, while the existing online/offline analysis and protocol payload assertions pass.

### Task 4: Collapse the scope reminder in place

**Files:**
- Modify: `frontend/src/widgets/inspection-workspace/ui/InspectScopeReminder.tsx`
- Create: `frontend/tests/component/inspection-workspace/inspect-scope-reminder.component.test.tsx`
- Create: `frontend/tests/e2e/journeys/inspector/inspect-progressive-disclosure.e2e.spec.ts`

**Interfaces:**
- Consumes: existing `inspectScopeReminder` copy and `scopeReferencePath`.
- Produces: an in-place collapsed reminder with the same bullets and link revealed by an accessible toggle.

- [ ] **Step 1: Write the failing component test**

Create a static-markup test that expects the default collapsed state:

```tsx
test("collapses scope details by default while keeping the reminder heading", () => {
  const markup = renderToStaticMarkup(<InspectScopeReminder />);

  assert.match(markup, /Scope Reminder/);
  assert.match(markup, /aria-expanded="false"/);
  assert.doesNotMatch(markup, /Pork samples only/);
  assert.doesNotMatch(markup, /Scope and delimitations/);
});
```

- [ ] **Step 2: Run the component test and verify the expected failure**

Run from `frontend/`:

```bash
npx tsx --test tests/component/inspection-workspace/inspect-scope-reminder.component.test.tsx
```

Expected: the test fails because the current reminder always renders the bullets and reference link and has no disclosure state.

- [ ] **Step 3: Implement the in-place reminder toggle**

Use `useState(false)` and `ChevronDown`/`ChevronUp`. Keep the section in the same position and keep the existing title, bullet data, CTA copy, and link path. Make the heading row a button with `aria-expanded`, `aria-controls="inspect-scope-reminder-content"`, and an accessible label such as `Show scope reminder details` / `Hide scope reminder details`; render the existing list and CTA only when expanded.

- [ ] **Step 4: Add and run the mobile disclosure journey**

Create `frontend/tests/e2e/journeys/inspector/inspect-progressive-disclosure.e2e.spec.ts` with this test:

```ts
import { test, expect } from "@playwright/test";
import { mockCommonApi, seedSignedInSession } from "../../../support/fixtures/app";

test("keeps the inspect page focused and expands the scope reminder in place", async ({ page }) => {
  await page.setViewportSize({ width: 340, height: 800 });
  await seedSignedInSession(page, { userId: "user-1" });
  await mockCommonApi(page, { userId: "user-1" });

  await page.goto("/inspect");
  await expect(page.getByRole("heading", { name: "Inspect" })).toBeVisible();
  await expect(page.getByText("Pork samples only")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Analysis Output" })).toHaveCount(0);

  const showDetails = page.getByRole("button", { name: "Show scope reminder details" });
  await expect(showDetails).toHaveAttribute("aria-expanded", "false");
  await showDetails.click();
  await expect(page.getByText("Pork samples only")).toBeVisible();

  const hideDetails = page.getByRole("button", { name: "Hide scope reminder details" });
  await hideDetails.click();
  await expect(page.getByText("Pork samples only")).toHaveCount(0);
});
```

Run:

```bash
npx tsx --test tests/component/inspection-workspace/inspect-scope-reminder.component.test.tsx
npx playwright test tests/e2e/journeys/inspector/inspect-progressive-disclosure.e2e.spec.ts --reporter=line
```

Expected: both tests pass at the narrow mobile viewport.

### Task 5: Run the relevant gates and commit

**Files:**
- Modify: only the files listed in Tasks 1–4.

- [ ] **Step 1: Run all focused inspect-page tests**

```bash
npx tsx --test tests/component/inspection-workspace/inspect-pre-scan-section.component.test.tsx tests/component/inspection-workspace/inspect-capture-section.component.test.tsx tests/component/inspection-workspace/inspect-scope-reminder.component.test.tsx tests/integration/camera/camera-quality.integration.test.tsx
npx playwright test tests/e2e/journeys/inspector/inspect-progressive-disclosure.e2e.spec.ts tests/e2e/offline/offline-analysis.e2e.spec.ts --reporter=line
```

Expected: all focused component/integration/E2E tests pass.

- [ ] **Step 2: Run repository checks**

```bash
npm run typecheck
npm run lint
git diff --check
```

Expected: typecheck exits 0, lint exits 0 with only the repository's existing warnings, and no whitespace errors are reported.

- [ ] **Step 3: Review and commit only the inspect-page work**

```bash
git diff -- frontend/src frontend/tests
git add frontend/src/widgets/inspection-workspace frontend/src/features/inspection-capture/ui/camera-capture-view.tsx frontend/tests/component/inspection-workspace frontend/tests/integration/camera/camera-quality.integration.test.tsx frontend/tests/e2e/offline/offline-analysis.e2e.spec.ts frontend/tests/e2e/journeys/inspector/inspect-progressive-disclosure.e2e.spec.ts
git commit -m "feat: simplify inspector workflow disclosures"
```

Do not stage the unrelated backend files or documentation outside this task.
