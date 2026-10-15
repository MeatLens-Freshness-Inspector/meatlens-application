# One-click Analyze Sample Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the captured-image action say `Analyze Sample` and start the existing inspection analysis after one click for camera, phone-camera, and file-upload sources.

**Architecture:** Keep capture preparation and quality gating inside the inspection-capture feature. The workspace will mark a successfully captured, non-protocol payload for immediate analysis, then trigger the existing `handleAnalyze` callback after the payload is committed to React state. The existing secondary analysis action remains available only as a retry/recovery path when model preparation or analysis failure requires it.

**Tech Stack:** React 18, TypeScript, Vite, Playwright, Node test runner, npm workspaces.

## Global Constraints

- Preserve the existing capture quality rules: failed quality disables the action, while warnings allow proceeding.
- Preserve pre-scan safety behavior: protocol failures produce the current spoiled result and do not invoke model analysis.
- Apply the one-click behavior to all capture sources handled by `CameraCapture`.
- Do not weaken, skip, focus, or remove existing tests.
- Run the affected frontend checks and the repository CI-equivalent checks before completion.

---

### Task 1: Update the capture-flow tests first

**Files:**
- Modify: `frontend/tests/unit/hooks/camera-view.unit.test.tsx`
- Modify: `frontend/tests/integration/camera/camera-quality.integration.test.tsx`
- Modify: `frontend/tests/e2e/offline/offline-analysis.e2e.spec.ts`
- Modify: `frontend/tests/e2e/journeys/inspector/inspect-page.e2e.spec.ts`
- Modify: `frontend/tests/e2e/journeys/inspector/camera-quality.e2e.spec.ts`

**Interfaces:**
- Consumes: the existing `CameraCaptureView` markup and `/inspect` capture journeys.
- Produces: assertions that the visible captured-image action is `Analyze Sample`, that `Use Photo` is absent, and that the first click reaches analysis/save behavior.

- [ ] **Step 1: Change the static capture expectations**

In both `camera-view.unit.test.tsx` and `camera-quality.integration.test.tsx`, replace captured-state assertions for `/Use Photo/` with `/Analyze Sample/`. Keep the idle-state assertion that `/Use Photo/` is absent and add `assert.doesNotMatch(markup, /Use Photo/)` to the captured warning test so the old copy cannot return.

- [ ] **Step 2: Change the browser journeys to click the new action once**

Replace every `page.getByRole("button", { name: "Use Photo" }).click()` and `/use photo/i` locator with the corresponding `Analyze Sample` locator. In the existing warning-quality journey, keep the assertion that the post-click UI exposes an analysis/preparing state, but update its wording and comment to describe the single action. In the failed-quality journeys, assert that `Analyze Sample` is disabled and that no separate analysis action is available after the blocked capture.

- [ ] **Step 3: Run the focused tests before implementation**

Run:

```powershell
npm run test:unit -w frontend -- --test-name-pattern "CameraCaptureView"
npm run test:integration -w frontend -- --test-name-pattern "quality"
```

Expected: the updated tests fail only because the production captured-state label is still `Use Photo`; no unrelated failure should be introduced.

- [ ] **Step 4: Commit the test expectations**

```powershell
git add frontend/tests/unit/hooks/camera-view.unit.test.tsx frontend/tests/integration/camera/camera-quality.integration.test.tsx frontend/tests/e2e/offline/offline-analysis.e2e.spec.ts frontend/tests/e2e/journeys/inspector/inspect-page.e2e.spec.ts frontend/tests/e2e/journeys/inspector/camera-quality.e2e.spec.ts
git commit -m "test: require one-click sample analysis"
```

### Task 2: Rename the captured-image action

**Files:**
- Modify: `frontend/src/features/inspection-capture/ui/camera-capture-view.tsx:1,314-325`

**Interfaces:**
- Consumes: the existing `onConfirmCapture` callback and capture-quality disabled state.
- Produces: a captured-image button labeled `Analyze Sample` while preserving its existing callback and disabled behavior.

- [ ] **Step 1: Replace the captured-state icon and label**

Update the lucide import to include `ScanLine`, remove `Check` if it is no longer used, and change the captured-state button body to:

```tsx
<Button
  onClick={onConfirmCapture}
  disabled={disabled || (captureQualityResult !== null && !captureQualityResult.canProceed)}
  className="w-full gap-2 rounded-xl min-[380px]:flex-1"
>
  <ScanLine className="h-4 w-4" /> Analyze Sample
</Button>
```

Do not change `onConfirmCapture`, the quality gate, `Retake`, or any camera/file input controls in this task.

- [ ] **Step 2: Run the static capture tests**

Run:

```powershell
npm run test:unit -w frontend -- --test-name-pattern "CameraCaptureView"
npm run test:integration -w frontend -- --test-name-pattern "quality"
```

Expected: the static unit and integration tests pass for the new copy; the end-to-end one-click analysis tests remain the next gate.

- [ ] **Step 3: Commit the capture copy change**

```powershell
git add frontend/src/features/inspection-capture/ui/camera-capture-view.tsx
git commit -m "feat: rename capture confirmation to analyze sample"
```

### Task 3: Start analysis from the same capture click

**Files:**
- Modify: `frontend/src/widgets/inspection-workspace/model/use-inspection-workspace.ts:around handleCapture, handleAnalyze, and returned view model`
- Create: `frontend/src/widgets/inspection-workspace/model/use-immediate-analysis.ts`
- Modify: the capture view types, camera session, and inspection capture section to hide the committed preview confirmation action

**Interfaces:**
- Consumes: `CapturedImagePayload`, the existing `handleCapture`, `handleAnalyze`, `inspectionDecisionSource`, and the protocol result state.
- Produces: a one-shot immediate-analysis transition for any successful non-protocol capture, while retaining the existing `onAnalyze` retry action.

- [ ] **Step 1: Add a pending immediate-analysis state**

Add a boolean state next to the existing analysis state:

```ts
const [isImmediateAnalysisPending, setIsImmediateAnalysisPending] = useState(false);
```

In `handleCapture`, return early without setting the pending flag when saving is active or the pre-scan checklist is incomplete. After the existing `protocolTriggered` value is computed and capture state is registered, set the flag only for real analysis work:

```ts
const mockAnalysisResult = getMockOfflineAnalysisResult();
setIsImmediateAnalysisPending(!protocolTriggered && !mockAnalysisResult);
```

This keeps protocol failures and existing deterministic mock fixtures out of the model path.

- [ ] **Step 2: Trigger the existing analysis callback after capture state is committed**

Add `useImmediateAnalysis` after `handleAnalyze` is declared so it uses the newly committed `capturedInput` and the current submission state. The helper clears the pending flag before invoking the existing callback and returns without analysis when a protocol result is already present.

```ts
useEffect(() => {
  if (!isImmediateAnalysisPending || !capturedInput) return;

  if (inspectionDecisionSource === "protocol_pre_scan" || result) {
    setIsImmediateAnalysisPending(false);
    return;
  }

  setIsImmediateAnalysisPending(false);
  void handleAnalyze();
}, [capturedInput, handleAnalyze, inspectionDecisionSource, isImmediateAnalysisPending, result]);
```

The helper must run only after `setCapturedInput` has committed. It must not duplicate analysis when a protocol result or mock result is already present, and it must use the existing `handleAnalyze` error/loading behavior rather than duplicating inference logic.

- [ ] **Step 3: Hide the retry action during the automatic transition**

Update the returned view-model calculation so the secondary `Analyze Sample` action is hidden while the automatic transition is pending or inference is in flight, but returns if analysis fails or model preparation is not ready:

```ts
showAnalyzeAction: Boolean(
  capturedInput &&
    !result &&
    !isImmediateAnalysisPending &&
    !isAnalyzing &&
    inspectionDecisionSource !== "protocol_pre_scan",
),
```

Keep `onAnalyze: handleAnalyze` unchanged so the existing action remains a retry path when needed.

Pass `showCaptureConfirmAction={!Boolean(capturedInput)}` into `CameraCapture` so the preview-level confirmation action disappears after the workspace accepts the capture; keep Retake available.

- [ ] **Step 4: Reset the pending state with the capture workflow**

In `handleReset`, clear `isImmediateAnalysisPending` alongside `capturedInput` and `result`. Also clear it in any existing retake/reset path owned by the workspace if one is added during implementation, so a discarded capture cannot trigger analysis later.

- [ ] **Step 5: Run focused analysis journeys**

Run:

```powershell
npx playwright test tests/e2e/offline/offline-analysis.e2e.spec.ts tests/e2e/journeys/inspector/inspect-page.e2e.spec.ts tests/e2e/journeys/inspector/camera-quality.e2e.spec.ts
```

Expected: the first `Analyze Sample` click reaches analysis output and existing save/queue assertions still pass; failed-quality captures remain blocked; pre-scan protocol failures still produce a spoiled result and no model analysis action.

- [ ] **Step 6: Commit the one-click transition**

```powershell
git add frontend/src/widgets/inspection-workspace/model/use-inspection-workspace.ts
git commit -m "feat: analyze captured samples in one click"
```

### Task 4: Run the repository quality gates

**Files:**
- No additional files expected.

**Interfaces:**
- Consumes: the implementation and tests from Tasks 1–3.
- Produces: fresh local verification output for the CI gate.

- [ ] **Step 1: Run frontend lint and typecheck**

```powershell
npm run lint -w frontend
npm run typecheck -w frontend
```

Expected: both commands exit 0 with no new lint or TypeScript errors.

- [ ] **Step 2: Run the frontend build**

```powershell
npm run build:frontend
```

Expected: Vite production build exits 0 and the model preflight remains valid.

- [ ] **Step 3: Run the repository CI-equivalent suite**

```powershell
npm run test:ci
```

Expected: all required lint, typecheck, script, documentation, frontend/backend fast, backend integration, and contract lanes pass without skipped or weakened tests.

- [ ] **Step 4: Review the final diff and status**

```powershell
git diff HEAD~3..HEAD --check
git status --short
```

Expected: only the approved design/plan and one-click capture changes are present, with no whitespace errors or unrelated worktree edits.
