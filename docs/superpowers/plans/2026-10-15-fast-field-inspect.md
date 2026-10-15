# Fast Field Inspect Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Make the Inspect page a fast, single-path mobile workflow for Ikot Palengke inspectors while preserving the current safety, offline, analysis, and persistence rules.

**Architecture:** Keep the existing inspection workspace view model as the workflow owner. Add a small pure location-memory module for user-scoped local convenience, make the camera capture feature optionally auto-commit accepted phone-camera images, and keep useImmediateAnalysis responsible for starting the existing analysis once the capture is committed and the model is ready. Reorder and compact the existing Inspect sections without adding a second user mode.

**Tech Stack:** React 18, TypeScript, React Router, Tailwind CSS, node:test/tsx, Playwright, existing ONNX/offline-analysis runtime, existing localStorage/session/offline queue infrastructure.

## Global Constraints

- The pre-scan safety protocol remains required before the camera can open for ordinary inspector sessions.
- A failed safety answer continues to produce a protocol-spoiled result and must not run AI.
- GPS is optional: capture and save must continue when GPS is unavailable, times out, or the device is offline.
- This pass must not add designated market coordinates, an online geofence check, backend endpoints, database columns, migrations, or offline queue fields.
- The current market location is remembered only as a user-scoped client-side convenience; no inspection image or inspection data may be stored in that entry.
- Accepted phone-camera captures must start the existing analysis without a second app-level confirmation tap.
- Failed image-quality checks must not call the inspection capture callback and must present a retake action.
- Existing online, offline, protocol-spoiled, low-confidence, manual-save, dispute, and auto-save semantics remain unchanged.
- Keep all existing tests; do not use focused tests, skipped tests, weakened assertions, or disabled quality gates.
- Run targeted checks after each task, then run npm run test:ci and npm run build:frontend before completion.

## File Map

### New files

- frontend/src/widgets/inspection-workspace/model/location-memory.ts — pure, exception-safe helpers for reading, validating, and writing the signed-in inspector's remembered market location.
- frontend/tests/unit/features/inspection-workspace/location-memory.unit.test.ts — unit coverage for valid, invalid, user-scoped, and unavailable storage behavior.

### Existing files to modify

- frontend/src/widgets/inspection-workspace/model/use-inspection-workspace.ts — hydrate and persist the remembered location, expose capture-to-analysis progress, and wait for model readiness before firing automatic analysis.
- frontend/src/widgets/inspection-workspace/model/types.ts — add the view-model state needed for automatic analysis progress and remove obsolete app-level confirmation props.
- frontend/src/widgets/inspection-workspace/model/use-immediate-analysis.ts — retain the pending state until the active model is ready, then start analysis once.
- frontend/src/widgets/inspection-workspace/ui/inspection-workspace.tsx — put the active mobile workflow first and move secondary scope/status content below it.
- frontend/src/widgets/inspection-workspace/ui/InspectHeroSection.tsx — replace the large status-card hero with a compact header/location summary.
- frontend/src/widgets/inspection-workspace/ui/InspectPreScanSection.tsx — shorten copy and reduce vertical friction while preserving every field and validation rule.
- frontend/src/widgets/inspection-workspace/ui/InspectCaptureSection.tsx — make the camera action primary, show location change compactly, and display plain-language capture/analysis progress.
- frontend/src/widgets/inspection-workspace/ui/InspectAnalysisSection.tsx — reduce the empty-state height on mobile and prioritize the decision result.
- frontend/src/widgets/inspection-workspace/ui/InspectActionsSection.tsx — make New Scan the clear next action after save/queue.
- frontend/src/features/inspection-capture/model/types.ts — add an opt-in auto-commit prop for accepted camera captures.
- frontend/src/features/inspection-capture/model/camera-session.ts — centralize capture commit logic and auto-commit accepted phone-camera/canvas captures without bypassing quality checks.
- frontend/src/features/inspection-capture/ui/camera-capture.tsx — pass the new camera option through the feature boundary.
- frontend/src/features/inspection-capture/ui/camera-capture-view.tsx — hide the duplicate app-level confirmation when auto-commit is active and retain retake guidance.
- frontend/src/widgets/inspection-workspace/model/use-inspection-workspace.ts — make the active-model warm-up have one clear owner; do not change model selection or inference behavior.

### Existing tests to modify or extend

- frontend/tests/component/inspection-workspace/inspect-pre-scan-section.component.test.tsx — assert compact safety copy still exposes all protocol controls and conditional fields.
- frontend/tests/component/inspection-workspace/inspect-capture-section.component.test.tsx — assert the compact location/camera/progress presentation.
- frontend/tests/unit/features/inspection-workspace/inspection-page.unit.test.tsx — cover the new view-model helper exports or page-level state contract if needed.
- frontend/tests/unit/features/inspection-workspace/inspection-analysis.unit.test.ts — cover waiting-for-model versus running/complete status if the state helper changes.
- frontend/tests/unit/features/inspection-capture/camera-session.unit.test.ts — cover capture-device helpers and any extracted capture-commit helper.
- frontend/tests/unit/features/offline-analysis/analysis-prewarm.unit.test.ts — add a regression for one active-model warm-up path if the runtime boundary changes.
- frontend/tests/e2e/journeys/inspector/camera-capture.e2e.spec.ts — assert the standard inspector camera path has no second app-level confirmation and still preserves quality/retake behavior.
- frontend/tests/e2e/offline/offline-analysis.e2e.spec.ts — remove manual Analyze Sample clicks from accepted captures and assert automatic analysis/queue behavior.

No backend source, migration, API contract, or database file is in the file map.

---

### Task 1: Add user-scoped location memory helpers

**Files:**
- Create: frontend/src/widgets/inspection-workspace/model/location-memory.ts
- Create: frontend/tests/unit/features/inspection-workspace/location-memory.unit.test.ts

**Interfaces:**
- Consumes: a signed-in user ID, a normalized list of valid market names, and a storage-like object.
- Produces: getInspectionLocationStorageKey, readRememberedMarketLocation, writeRememberedMarketLocation, and resolveRememberedMarketLocation for the workspace hook.

- [ ] Step 1: Write the failing unit tests

Use an in-memory storage double and test the public helpers:

~~~ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  getInspectionLocationStorageKey,
  readRememberedMarketLocation,
  resolveRememberedMarketLocation,
  writeRememberedMarketLocation,
} from "../../../../src/widgets/inspection-workspace/model/location-memory";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
}

test("scopes the remembered location key to the signed-in inspector", () => {
  assert.notEqual(
    getInspectionLocationStorageKey("user-1"),
    getInspectionLocationStorageKey("user-2"),
  );
});

test("reads and writes a trimmed remembered market location", () => {
  const storage = createStorage();
  writeRememberedMarketLocation(storage, "user-1", "  New Market  ");

  assert.equal(readRememberedMarketLocation(storage, "user-1"), "New Market");
});

test("ignores invalid or empty remembered values", () => {
  const storage = createStorage();
  writeRememberedMarketLocation(storage, "user-1", " ");

  assert.equal(readRememberedMarketLocation(storage, "user-1"), null);
  assert.equal(
    resolveRememberedMarketLocation("Missing Market", "Old Market", ["Old Market", "New Market"]),
    "Old Market",
  );
});

test("keeps a valid remembered location and falls back safely", () => {
  assert.equal(
    resolveRememberedMarketLocation("New Market", "Old Market", ["Old Market", "New Market"]),
    "New Market",
  );
  assert.equal(
    resolveRememberedMarketLocation(null, "Old Market", []),
    "",
  );
});

test("storage failures do not block inspection", () => {
  const unavailableStorage = {
    getItem: () => { throw new Error("storage blocked"); },
    setItem: () => { throw new Error("storage blocked"); },
  };

  assert.equal(readRememberedMarketLocation(unavailableStorage, "user-1"), null);
  assert.doesNotThrow(() => writeRememberedMarketLocation(unavailableStorage, "user-1", "Old Market"));
});
~~~

- [ ] Step 2: Run the focused test and verify it fails

Run from the repository root:

~~~text
npx tsx --test frontend/tests/unit/features/inspection-workspace/location-memory.unit.test.ts
~~~

Expected: FAIL because location-memory.ts does not exist yet.

- [ ] Step 3: Implement the minimal exception-safe helper module

Create the module with this contract:

~~~ts
export type LocationStorage = Pick<Storage, "getItem" | "setItem">;

const LOCATION_STORAGE_PREFIX = "meatlens.inspect.last-market-location";

export function getInspectionLocationStorageKey(userId: string): string {
  return LOCATION_STORAGE_PREFIX + ":" + userId;
}

export function readRememberedMarketLocation(
  storage: LocationStorage | null | undefined,
  userId: string,
): string | null {
  if (!storage || !userId.trim()) return null;

  try {
    const value = storage.getItem(getInspectionLocationStorageKey(userId));
    const normalized = value?.trim() ?? "";
    return normalized || null;
  } catch {
    return null;
  }
}

export function writeRememberedMarketLocation(
  storage: LocationStorage | null | undefined,
  userId: string,
  location: string,
): void {
  if (!storage || !userId.trim() || !location.trim()) return;

  try {
    storage.setItem(
      getInspectionLocationStorageKey(userId),
      location.trim(),
    );
  } catch {
    // Private browsing or blocked storage must never block a capture.
  }
}

export function resolveRememberedMarketLocation(
  rememberedLocation: string | null,
  currentLocation: string,
  validLocations: readonly string[],
): string {
  if (rememberedLocation && validLocations.includes(rememberedLocation)) {
    return rememberedLocation;
  }

  if (currentLocation && validLocations.includes(currentLocation)) {
    return currentLocation;
  }

  return validLocations[0] ?? "";
}
~~~

The implementation must not use inspection IDs, image data, GPS data, or certificate data in the storage entry.

- [ ] Step 4: Run the focused test and verify it passes

Run npx tsx --test frontend/tests/unit/features/inspection-workspace/location-memory.unit.test.ts. Expected: all location-memory tests pass.

- [ ] Step 5: Commit the focused helper change

~~~text
git add frontend/src/widgets/inspection-workspace/model/location-memory.ts frontend/tests/unit/features/inspection-workspace/location-memory.unit.test.ts
git commit -m "feat: remember inspector market location"
~~~

### Task 2: Integrate location memory and compact the Inspect workflow

**Files:**
- Modify: frontend/src/widgets/inspection-workspace/model/use-inspection-workspace.ts
- Modify: frontend/src/widgets/inspection-workspace/model/types.ts
- Modify: frontend/src/widgets/inspection-workspace/ui/inspection-workspace.tsx
- Modify: frontend/src/widgets/inspection-workspace/ui/InspectHeroSection.tsx
- Modify: frontend/src/widgets/inspection-workspace/ui/InspectPreScanSection.tsx
- Modify: frontend/src/widgets/inspection-workspace/ui/InspectCaptureSection.tsx
- Modify: frontend/src/widgets/inspection-workspace/ui/InspectAnalysisSection.tsx
- Modify: frontend/src/widgets/inspection-workspace/ui/InspectActionsSection.tsx
- Test: frontend/tests/component/inspection-workspace/inspect-pre-scan-section.component.test.tsx
- Test: frontend/tests/component/inspection-workspace/inspect-capture-section.component.test.tsx
- Test: frontend/tests/unit/features/inspection-workspace/inspection-page.unit.test.tsx

**Interfaces:**
- Consumes: the location-memory helpers from Task 1 and the current InspectPageViewModel.
- Produces: a compact mobile-first page with a visible current location/change action, no oversized pre-capture hero, and view-model state for capture-to-analysis progress.

- [ ] Step 1: Write failing component assertions for plain-language compact workflow

Extend the existing component test to require the new user-facing strings while retaining all safety controls:

~~~ts
assert.match(markup, /Before you scan/);
assert.match(markup, /Check the stall details and safety conditions before taking a photo/);
assert.match(markup, /Storage Correct/);
assert.match(markup, /Light Color Correct/);
assert.match(markup, /Area Clean/);
~~~

Add a capture-section component test that renders a completed checklist and asserts:

~~~ts
assert.match(markup, /Open Camera/);
assert.match(markup, /Change location/);
assert.doesNotMatch(markup, /MobileNetV3/);
~~~

Use the existing server-rendered component-test style and do not remove the existing radio-count or expired-certificate assertions.

- [ ] Step 2: Run the affected component tests and verify the new assertions fail

~~~text
npx tsx --test frontend/tests/component/inspection-workspace/inspect-pre-scan-section.component.test.tsx
~~~

Expected: the existing radio tests pass, and the new copy assertions fail until the UI is updated.

- [ ] Step 3: Hydrate and persist the remembered location in the workspace hook

Import the Task 1 helpers and add a safe storage accessor:

~~~ts
function getLocationStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}
~~~

When the authenticated user changes, read the remembered value and resolve it only against the current marketLocations list. When the market list finishes loading, resolve the remembered value again so a stale/invalid location cannot remain selected. Replace the direct selected-location setter with a callback that writes the normalized selection:

~~~ts
const handleSelectedLocationChange = useCallback((value: string) => {
  setSelectedLocation(value);
  if (user) {
    writeRememberedMarketLocation(getLocationStorage(), user.id, value);
  }
}, [user]);
~~~

Keep requestCurrentCoordinates optional: it still runs after capture, its result is persisted through the existing coordinates field, and failure only changes the status copy to the existing unavailable state. Do not add a market-coordinate lookup or a geofence check.

- [ ] Step 4: Replace the pre-capture hero with a compact header and move secondary content

Update inspection-workspace.tsx so the rendered order is: the compact InspectHeroSection with the current location, the existing InspectPreScanSection props, the existing capture/analysis two-column region, conditional InspectActionsSection, InspectScopeReminder, and InspectionDisputeSection. Keep every existing callback and inspection-state prop wired to the same view-model field; only the visual order and section prop names change.

The compact hero must show the Inspect heading, current market, and a visible Change location affordance without repeating the full four-card status grid. Keep coordinate status available in the capture section or compact status line. The scope reminder remains rendered, but below the active workflow so it does not push the checklist/camera below the first usable mobile viewport.

- [ ] Step 5: Compact the pre-scan and capture presentation without changing validation

In InspectPreScanSection.tsx:

- Change the heading to Before you scan.
- Use short copy: Check the stall details and safety conditions before taking a photo.
- Preserve all seven current fields, the conditional What Color? field, developer bypass notice, and expired-certificate alert.
- Keep the existing large Yes/No touch targets and accessible labels.
- Show Checklist complete or Required near the section header.

In InspectCaptureSection.tsx:

- Keep Open Camera as the primary capture button.
- Display the current market in a compact summary row and expose the existing selector through the text Change location or an equivalently clear accessible label.
- Remove duplicate explanatory GPS paragraphs from the main path; keep one concise fallback status such as Location saved; GPS will be added when available.
- Remove the app-level Analyze Sample button from the normal capture path; Task 3 will start analysis automatically.
- Render plain progress messages: Getting the scan ready... while the local model is not ready and Analyzing sample... while inference runs.

In InspectAnalysisSection.tsx, reduce the empty-state minimum height on mobile and use Analysis will appear here after the photo is checked. rather than a large waiting panel.

In InspectActionsSection.tsx, use the default button styling for New Scan when saveStatus is saved or queued, and keep manual Save Record secondary for the existing lower-confidence path. Do not change the disabled conditions or mutation calls.

- [ ] Step 6: Update view-model types and remove obsolete app-level confirmation wiring

Add a view-model boolean such as:

~~~ts
isAnalysisPending: boolean;
~~~

Set it from immediate-analysis pending, model preparation, and active inference. Remove showAnalyzeAction from the normal capture-section contract and stop passing onAnalyze to that component. Keep handleAnalyze internal to the workspace hook because useImmediateAnalysis still invokes it.

- [ ] Step 7: Run the focused frontend checks

~~~text
npx tsx --test frontend/tests/component/inspection-workspace/inspect-pre-scan-section.component.test.tsx
npm run lint -w frontend
npm run typecheck -w frontend
~~~

Expected: component tests pass, lint has no errors, and typecheck exits successfully. Existing warnings must not be converted into errors or hidden.

- [ ] Step 8: Commit the compact workflow change

~~~text
git add frontend/src/widgets/inspection-workspace frontend/tests/component/inspection-workspace/inspect-pre-scan-section.component.test.tsx frontend/tests/unit/features/inspection-workspace/inspection-page.unit.test.tsx
git commit -m "feat: streamline inspect page for field use"
~~~

### Task 3: Auto-commit accepted camera captures into immediate analysis

**Files:**
- Modify: frontend/src/features/inspection-capture/model/types.ts
- Modify: frontend/src/features/inspection-capture/model/camera-session.ts
- Modify: frontend/src/features/inspection-capture/ui/camera-capture.tsx
- Modify: frontend/src/features/inspection-capture/ui/camera-capture-view.tsx
- Modify: frontend/src/widgets/inspection-workspace/ui/InspectCaptureSection.tsx
- Modify: frontend/src/widgets/inspection-workspace/model/use-immediate-analysis.ts
- Modify: frontend/src/widgets/inspection-workspace/model/use-inspection-workspace.ts
- Test: frontend/tests/unit/features/inspection-capture/camera-session.unit.test.ts
- Test: frontend/tests/unit/features/inspection-workspace/inspection-analysis.unit.test.ts
- Test: frontend/tests/e2e/journeys/inspector/camera-capture.e2e.spec.ts
- Test: frontend/tests/e2e/offline/offline-analysis.e2e.spec.ts

**Interfaces:**
- Consumes: the existing CapturedImagePayload, quality result, guide-box calculation, and useImmediateAnalysis path.
- Produces: an opt-in autoConfirmCapture camera prop. When true, acceptable canvas/camera-app captures call onCapture once and do not render a duplicate app-level confirmation.

- [ ] Step 1: Write failing camera-flow assertions

Add a camera acceptance assertion that the standard phone-camera path has no app-level confirmation after a valid image returns:

~~~ts
await uploadSamplePhoto(page);
await expect(page.getByRole("button", { name: /Analyze Sample/i })).toHaveCount(0);
await expect(page.getByText(/Analyzing sample|Getting the scan ready/i)).toBeVisible();
~~~

Update the existing online and offline analysis journeys to remove the manual Analyze Sample click. Keep their result, source, and offline queue assertions unchanged.

- [ ] Step 2: Run the affected E2E files and verify the new flow fails

~~~text
npx playwright test frontend/tests/e2e/journeys/inspector/camera-capture.e2e.spec.ts frontend/tests/e2e/offline/offline-analysis.e2e.spec.ts
~~~

Expected: the current application still waits for the manual confirmation, so the new no-button/progress assertions fail.

- [ ] Step 3: Add the opt-in camera prop and centralize capture commit behavior

Extend the props contract:

~~~ts
export interface CameraCaptureProps {
  onCapture: (payload: CapturedImagePayload) => void;
  className?: string;
  disabled?: boolean;
  allowFileUpload?: boolean;
  allowInAppCamera?: boolean;
  showModelInputPreview?: boolean;
  disableRoiSegmentation?: boolean;
  showCaptureConfirmAction?: boolean;
  autoConfirmCapture?: boolean;
}
~~~

In useCameraCapture, create one commitCapture(file, source, guideBox) callback that calls onCapture with the existing payload shape and guard it with a ref so one capture attempt cannot call onCapture twice. Reset that guard in retake, startCamera, and component reset cleanup.

For a phone-camera file where qualitySource is cameraApp, call commitCapture from the existing image-load handler after computing the guide box, but only when the quality result has canProceed === true. For an in-app canvas capture, create the file in the existing toBlob callback and call commitCapture immediately only when the local canvas quality result can proceed. Keep debug file upload behavior manual unless its existing test contract explicitly opts into auto-commit.

The quality gate must run before commitCapture; do not call onCapture for a rejected result.

- [ ] Step 4: Hide only the duplicate app-level confirmation

Pass autoConfirmCapture through CameraCapture and return:

~~~ts
showCaptureConfirmAction: showCaptureConfirmAction && !autoConfirmCapture,
~~~

Keep Retake visible for a captured image and keep the quality banner unchanged. The phone's own native camera UI remains outside the app and is not modified.

In InspectCaptureSection, pass autoConfirmCapture true for the standard inspector capture station and remove the obsolete Analyze Sample app-level button. The developer-only debug file path may retain its existing manual confirmation if required by its tests.

- [ ] Step 5: Make immediate analysis wait for readiness instead of failing early

Extend the useImmediateAnalysis arguments with a readiness boolean:

~~~ts
export function useImmediateAnalysis(
  isPending: boolean,
  capturedInput: CapturedImagePayload | null,
  inspectionDecisionSource: InspectionDecisionSource | null,
  result: AnalysisResult | null,
  isReady: boolean,
  handleAnalyze: () => void | Promise<void>,
  clearPending: () => void,
) {
  useEffect(() => {
    if (!isPending || !capturedInput) return;

    if (inspectionDecisionSource === "protocol_pre_scan" || result) {
      clearPending();
      return;
    }

    if (!isReady) return;

    clearPending();
    void handleAnalyze();
  }, [
    capturedInput,
    clearPending,
    handleAnalyze,
    inspectionDecisionSource,
    isPending,
    isReady,
    result,
  ]);
}
~~~

Keep the pending flag when the active online model is not ready. Clear it and call handleAnalyze only after readiness becomes true. Clear it immediately for protocol results or an already available result. This prevents a fast camera return from losing the automatic analysis attempt while the model is still loading.

- [ ] Step 6: Run unit and E2E checks

~~~text
npx tsx --test frontend/tests/unit/features/inspection-capture/camera-session.unit.test.ts frontend/tests/unit/features/inspection-workspace/inspection-analysis.unit.test.ts
npx playwright test frontend/tests/e2e/journeys/inspector/camera-capture.e2e.spec.ts frontend/tests/e2e/offline/offline-analysis.e2e.spec.ts
~~~

Expected: accepted captures proceed automatically, rejected quality stops before analysis, protocol-failed captures still skip AI, and offline accepted/protocol flows keep their current queue assertions.

- [ ] Step 7: Commit the automatic capture flow

~~~text
git add frontend/src/features/inspection-capture frontend/src/widgets/inspection-workspace frontend/tests/unit/features/inspection-capture frontend/tests/unit/features/inspection-workspace frontend/tests/e2e/journeys/inspector/camera-capture.e2e.spec.ts frontend/tests/e2e/offline/offline-analysis.e2e.spec.ts
git commit -m "feat: analyze accepted captures automatically"
~~~

### Task 4: Consolidate model readiness and remove technical operator copy

**Files:**
- Modify: frontend/src/widgets/inspection-workspace/model/use-inspection-workspace.ts
- Modify: frontend/src/widgets/inspection-workspace/ui/InspectCaptureSection.tsx
- Test: frontend/tests/unit/features/offline-analysis/analysis-prewarm.unit.test.ts
- Test: frontend/tests/unit/features/offline-analysis/analysis-runtime.unit.test.ts

**Interfaces:**
- Consumes: the existing loadActiveAnalysisModel, prewarmModel, active model selection, and isAnalysisReady APIs.
- Produces: one predictable active-model readiness path with plain-language UI feedback.

- [ ] Step 1: Add a regression test for the active model warm-up boundary

Keep the existing prewarm scheduling test and add a runtime-level test that the existing selected-model loadPromise is reused by two simultaneous active-model requests. The test must exercise the existing runtime loader seam rather than downloading every model variant.

The test must assert a count of 1 for the active-model loader under two simultaneous readiness requests; it must not assert that all model variants are downloaded.

- [ ] Step 2: Run the warm-up tests and verify the new regression fails or exposes the current duplicate path

~~~text
npx tsx --test frontend/tests/unit/features/offline-analysis/analysis-prewarm.unit.test.ts frontend/tests/unit/features/offline-analysis/analysis-runtime.unit.test.ts
~~~

- [ ] Step 3: Make one owner responsible for page-level readiness

Replace the two current workspace readiness effects with one effect keyed by the resolved model-selection inputs. Keep app-shell boot warm-up in initializeAppRuntime, setActiveAnalysisModel before calling loadActiveAnalysisModel, and let the runtime's existing loadPromise share simultaneous callers. Preserve online/offline event listeners and retry timing.

Do not change model variant selection, preprocessing contracts, ROI segmentation, inference outputs, offline availability, or retry interval semantics.

- [ ] Step 4: Replace technical waiting copy

Use Getting the scan ready... in the inspector-facing capture progress state. Keep model names available only in developer diagnostics or detailed technical views.

- [ ] Step 5: Run warm-up, lint, and typecheck checks

~~~text
npx tsx --test frontend/tests/unit/features/offline-analysis/analysis-prewarm.unit.test.ts frontend/tests/unit/features/offline-analysis/analysis-runtime.unit.test.ts
npm run lint -w frontend
npm run typecheck -w frontend
~~~

- [ ] Step 6: Commit the readiness change

~~~text
git add frontend/src/widgets/inspection-workspace frontend/src/features/offline-analysis frontend/tests/unit/features/offline-analysis
git commit -m "perf: simplify inspection model readiness"
~~~

### Task 5: Finish result/reset behavior and accessibility acceptance coverage

**Files:**
- Modify: frontend/src/widgets/inspection-workspace/ui/InspectAnalysisSection.tsx
- Modify: frontend/src/widgets/inspection-workspace/ui/InspectActionsSection.tsx
- Modify: frontend/src/widgets/inspection-workspace/ui/InspectCaptureSection.tsx
- Modify: frontend/src/widgets/inspection-workspace/ui/InspectHeroSection.tsx
- Modify: frontend/tests/component/inspection-workspace/inspect-pre-scan-section.component.test.tsx
- Modify: frontend/tests/e2e/journeys/inspector/camera-capture.e2e.spec.ts
- Modify: frontend/tests/e2e/offline/offline-analysis.e2e.spec.ts
- Test: frontend/tests/e2e/journeys/inspector/camera-capture.e2e.spec.ts

**Interfaces:**
- Consumes: the compact workflow and automatic capture behavior from Tasks 2–4.
- Produces: a clear saved/queued result state, a location-preserving reset path, and mobile acceptance coverage for a non-technical inspector.

- [ ] Step 1: Add failing acceptance assertions

Add assertions for:

~~~ts
await expect(page.getByRole("button", { name: /New Scan/i })).toBeVisible();
await expect(page.getByText(/Analysis will appear here after the photo is checked/i)).toHaveCount(0);
~~~

After saving/queueing, assert that New Scan is the primary enabled action and that the current remembered market remains visible after reset. Keep existing protocol result and queue assertions.

- [ ] Step 2: Run the affected E2E tests and verify the new assertions fail

~~~text
npx playwright test frontend/tests/e2e/journeys/inspector/camera-capture.e2e.spec.ts frontend/tests/e2e/offline/offline-analysis.e2e.spec.ts
~~~

- [ ] Step 3: Implement result priority and reset behavior

Keep the existing result card and dispute functionality, but make the first visual result state show classification, confidence/label, recommendation, and saved/queued status. Use New Scan as the primary action after saved or queued.

In handleReset, continue clearing the current capture, result, save state, coordinate state, dispute state, and checklist answers according to the current product rule. Do not clear the remembered location storage entry. Ensure the selected location remains valid after reset.

- [ ] Step 4: Complete accessibility and plain-language checks

Verify in rendered markup and Playwright locators that:

- every checklist control retains an accessible label;
- Open Camera, Retake, New Scan, Change location, Getting the scan ready..., and Analyzing sample... are discoverable by role/name;
- no state relies on color alone;
- primary buttons retain comfortable touch sizing;
- developer-only controls remain absent for ordinary inspectors.

- [ ] Step 5: Run targeted component, unit, and E2E checks

~~~text
npx tsx --test frontend/tests/component/inspection-workspace/inspect-pre-scan-section.component.test.tsx frontend/tests/unit/features/inspection-workspace/location-memory.unit.test.ts
npx playwright test frontend/tests/e2e/journeys/inspector/camera-capture.e2e.spec.ts frontend/tests/e2e/offline/offline-analysis.e2e.spec.ts
~~~

- [ ] Step 6: Commit the result and accessibility polish

~~~text
git add frontend/src/widgets/inspection-workspace frontend/tests/component/inspection-workspace frontend/tests/unit/features/inspection-workspace frontend/tests/e2e/journeys/inspector/camera-capture.e2e.spec.ts frontend/tests/e2e/offline/offline-analysis.e2e.spec.ts
git commit -m "feat: prioritize next inspection action"
~~~

### Task 6: Verify the complete frontend-only change and document the coordinate follow-up

**Files:**
- Modify: docs/superpowers/plans/2026-10-15-fast-field-inspect.md for verification notes only when implementation discoveries require a precise plan correction.
- Modify: docs/superpowers/specs/2026-10-15-fast-field-inspect-design.md only when implementation changes an approved product rule.

**Interfaces:**
- Consumes: all implementation commits and their targeted test evidence.
- Produces: a clean, verified branch with explicit proof that backend/database files were not touched.

- [ ] Step 1: Inspect the final diff and file scope

Run:

~~~text
git status --short
git diff --stat HEAD~5..HEAD
git diff --name-only HEAD~5..HEAD
~~~

Confirm every changed application file is under frontend/ and that no backend/ or database migration file changed. If the commit count is greater than five because of testable sub-commits, inspect the range from the pre-task HEAD recorded before implementation.

- [ ] Step 2: Run the smallest complete frontend gates

~~~text
npm run lint -w frontend
npm run typecheck -w frontend
npm run test:unit -w frontend
npm run test:component -w frontend
npm run test:integration -w frontend
npm run test:architecture -w frontend
npm run build:frontend
~~~

Expected: all commands exit 0. Preserve any existing lint warnings; do not weaken the lint configuration.

- [ ] Step 3: Run the repository CI-equivalent gate

~~~text
npm run test:ci
~~~

Expected: lint, typecheck, scripts, documentation, frontend/backend fast tests, backend integration tests, and contract tests all pass. No lane may be skipped or made advisory.

- [ ] Step 4: Record the coordinate follow-up without implementing it in this pass

The final handoff should explicitly state:

- the fast-field change retains manual market selection plus optional device GPS capture;
- no designated market coordinates or online geofence check were added because the current market-location API only returns names;
- a future coordinate feature needs new API/database fields and an offline-cached reference set before it can safely validate location.

- [ ] Step 5: Commit only verification/documentation updates if needed

~~~text
git add docs/superpowers/specs/2026-10-15-fast-field-inspect-design.md docs/superpowers/plans/2026-10-15-fast-field-inspect.md
git commit -m "docs: record inspect verification and coordinate follow-up"
~~~

Do not create an empty commit. If no documentation update is needed, keep the existing final implementation commit as the last commit.

## Self-Review Checklist

### Spec coverage

- Safety checklist and protocol behavior: Task 2 preserves fields/gating; Task 3 preserves protocol bypass; Task 5 keeps protocol E2E coverage.
- Automatic accepted capture analysis: Task 3.
- Failed quality/retake path: Task 3.
- Location memory: Task 1 and Task 2.
- Optional GPS/offline fallback: Task 2 and the explicit coordinate boundary.
- Compact mobile layout and accessible copy: Tasks 2 and 5.
- Model readiness and technical-copy reduction: Task 4.
- Result/reset behavior: Task 5.
- Backend/database non-change: file map, Task 6, and final diff inspection.
- Full CI-equivalent verification: Task 6.

### Type consistency

- location-memory.ts exports the four helpers consumed by use-inspection-workspace.ts and tested by location-memory.unit.test.ts.
- autoConfirmCapture is added to CameraCaptureProps, consumed by useCameraCapture, and passed by InspectCaptureSection.
- useImmediateAnalysis readiness is provided by the existing workspace isModelReady state; no new backend or persistence type is introduced.
- isAnalysisPending is added to InspectPageViewModel and passed only to the capture UI.

### Placeholder scan

The plan contains no TODO, TBD, or unspecified implementation steps. Any future designated-coordinate/geofence work is deliberately named as a separate feature rather than left as an implementation placeholder in this task.

