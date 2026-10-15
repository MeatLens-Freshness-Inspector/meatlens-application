# Inspect Tutorial Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update the Inspect tutorial so it teaches automatic post-capture analysis, the complete current pre-scan checklist, and the save-before-dispute workflow.

**Architecture:** Keep the existing tutorial definition registry and mock-scene hotspot architecture. The model will describe a post-save `inspect-dispute` step, while the Inspect mock scene will render the capture, analysis, save-first dispute, and enabled-dispute states from the active step ID.

**Tech Stack:** React, TypeScript, Node test runner, server-rendered component tests, Tailwind utility classes, existing tutorial fixtures and `MockHotspot`.

## Global Constraints

- Do not change backend APIs, persistence, or database schemas.
- Do not add a standalone analysis tap; accepted captures teach that analysis starts automatically.
- Keep the tutorial usable for non-technical meat inspectors with plain, action-oriented copy.
- Preserve existing tutorial shell, navigation, and hotspot behavior.

---

### Task 1: Define and test the updated Inspect tutorial journey

**Files:**
- Modify: `frontend/src/features/tutorials/model/inspection-tutorial.ts`
- Modify: `frontend/tests/component/tutorials/tutorial-scene-registry.component.test.tsx`

**Interfaces:**
- Produces the Inspect step IDs `inspect-scope`, `inspect-market`, `inspect-prescan`, `inspect-capture`, `inspect-save`, and `inspect-dispute`.
- The capture step instruction must say that an accepted photo starts analysis automatically.
- The save step must describe saving before disputing; the dispute step must describe disputing a saved result.

- [ ] **Step 1: Write the failing regression assertions**

Add a focused component test that imports `tutorialDefinitions` and renders each relevant `TutorialScene`. Assert the exact Inspect step IDs, the capture copy, the absence of `Analyze Sample`, both additional checklist labels, the save-first dispute copy, and the post-save dispute copy:

```tsx
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
```

- [ ] **Step 2: Run the focused test and verify it fails for stale tutorial behavior**

Run `npm run test:component -w frontend -- tests/component/tutorials/tutorial-scene-registry.component.test.tsx`.
Expected: the existing tutorial fails because `inspect-analysis` remains in the registry and the current scene lacks the new copy/states.

- [ ] **Step 3: Update the tutorial definitions minimally**

Remove the `inspect-analysis` object. Update `inspect-capture` to use action-oriented automatic-analysis copy and blocks. Update `inspect-save` to explain the save-first dispute state. Add this post-save definition:

```ts
{
  id: "inspect-dispute",
  tutorialId: "inspect",
  sectionTitle: "Inspect demo",
  stepTitle: "Dispute a saved result",
  instruction: "After saving, use Dispute result if the classification does not match your field evidence. An administrator or developer will review it.",
  sceneTitle: "Inspect",
  sceneSubtitle: "Saved result review",
  hotspotLabel: "Dispute result",
  blocks: [
    { id: "inspect-saved-result", title: "Saved inspection", description: "The result is now stored in your inspection history." },
    { id: "inspect-dispute", title: "Dispute result", description: "Explain the evidence when the result does not match your field judgment.", tone: "accent", hotspotLabel: "Dispute result" },
  ],
},
```

- [ ] **Step 4: Run the focused test and verify it passes or exposes only scene gaps**

Run the same focused component command. Expected: the step IDs and model copy pass; any remaining failure identifies missing rendered scene text.

- [ ] **Step 5: Commit the model and regression-test changes**

```powershell
git add frontend/src/features/tutorials/model/inspection-tutorial.ts frontend/tests/component/tutorials/tutorial-scene-registry.component.test.tsx
git commit -m "test: define simplified inspect tutorial flow"
```

### Task 2: Render the current Inspect states in the tutorial mock

**Files:**
- Modify: `frontend/src/features/tutorials/ui/scenes/inspect-mock-scene.tsx`

**Interfaces:**
- Consumes the step IDs from Task 1.
- Renders automatic-analysis guidance for `inspect-capture`.
- Renders all current pre-scan concepts, a disabled save-first dispute state for `inspect-save`, and an enabled dispute hotspot for `inspect-dispute`.

- [ ] **Step 1: Add the automatic-analysis and checklist scene content**

Remove the `isAnalysis` branch and change capture/result state calculations to treat `inspect-save` and `inspect-dispute` as completed analysis states. Add `Light Color Correct` and `Area Clean` to the pre-scan grid. Under the capture mock, add exactly this status panel for the capture step:

```tsx
{isCapture && (
  <div
    data-tutorial-analysis-handoff
    className="mt-2 flex items-center gap-2 rounded-xl border border-primary/30 bg-[hsl(var(--primary)/0.08)] px-3 py-2"
  >
    <ScanLine className="h-4 w-4 text-primary" />
    <div>
      <p className="text-[9px] font-semibold">Analysis starts automatically</p>
      <p className="mt-0.5 text-[8px] text-muted-foreground">After you accept the photo, MeatLens checks the sample for you.</p>
    </div>
  </div>
)}
```

- [ ] **Step 2: Add the save-first dispute state**

For `inspect-save`, render a non-hotspot section with `data-tutorial-dispute-state="before-save"`, a `Dispute result` label, a disabled-looking action, and the exact instruction `Save the inspection first to dispute this result.` Keep the active `Save Record` hotspot as the step’s only advance action.

- [ ] **Step 3: Add the post-save dispute hotspot**

For `inspect-dispute`, render a saved-result status and wrap the enabled-looking `Dispute result` action in `MockHotspot` with `ariaLabel={step.hotspotLabel}`. Use `data-tutorial-dispute-state="after-save"` so the component test can distinguish the enabled state without depending on CSS classes.

- [ ] **Step 4: Run the focused tutorial component tests**

Run `npm run test:component -w frontend -- tests/component/tutorials/tutorial-scene-registry.component.test.tsx`.
Expected: the focused tutorial registry and scene assertions pass.

- [ ] **Step 5: Commit the mock-scene implementation**

```powershell
git add frontend/src/features/tutorials/ui/scenes/inspect-mock-scene.tsx
git commit -m "fix: align inspect tutorial with field flow"
```

### Task 3: Run the frontend completion gates

**Files:**
- No additional source files.

- [ ] **Step 1: Run frontend typecheck**

Run `npm run typecheck -w frontend`. Expected: exit code 0.

- [ ] **Step 2: Run frontend lint**

Run `npm run lint -w frontend`. Expected: exit code 0, with only the repository’s existing warnings.

- [ ] **Step 3: Run the production build**

Run `npm run build:frontend`. Expected: Vite build completes successfully.

- [ ] **Step 4: Review the final diff and status**

```powershell
git diff --check
git status --short
git log -4 --oneline
```

Expected: no whitespace errors and only the intended tutorial/spec/plan commits are present.

