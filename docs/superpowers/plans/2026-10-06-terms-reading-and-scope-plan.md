# Terms Reading Gate and Scope Clarification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with verification checkpoints.

**Goal:** Make signup require opening and scrolling through the Terms and Conditions before terms acknowledgement, and align the legal scope language around pork freshness-only screening.

**Architecture:** The terms dialog detects its scroll boundary and reports completion through an optional callback. The signup hook owns the completion state, passes it to the view, and sends it through pure validation so the UI and submit path enforce the same rule. The full terms and scope-reference page remain separate renderers with matching capability language.

**Tech Stack:** React 18, TypeScript, Radix Dialog, React Router, Playwright, Node test runner with `tsx`.

## Global Constraints

- Keep the scope limited to signup disclosure behavior and legal scope copy.
- MeatLens supports pork freshness screening only, with `Fresh`, `Not Fresh`, and `Spoiled` outputs.
- State explicitly that the product does not detect or diagnose sick meat, disease, illness, pathogens, contamination, parasites, chemical adulteration, or other health conditions.
- Keep privacy acceptance as a separate required signup step.
- Preserve all existing test coverage and run affected checks after each edit.
- Use frontend CI-equivalent checks: unit tests, component tests, E2E terms coverage, lint, typecheck, architecture checks, and frontend build.

## File Map

- Modify `frontend/src/widgets/legal/terms-and-conditions-dialog.tsx` to detect the scroll boundary and expose `onReadToEnd`.
- Modify `frontend/src/features/auth/model/signup.ts` to validate that the terms were read before they can be accepted.
- Modify `frontend/src/features/auth/model/use-signup.ts` to own the read-completion state and expose the handler to the view.
- Modify `frontend/src/pages/auth/components/signup-page-view.tsx` to disable the checkbox, provide accessible instructions, and wire the dialog callback.
- Modify `frontend/src/widgets/legal/terms-content.tsx` and `frontend/src/widgets/legal/scope-reference.ts` with matching scope/delimitations copy.
- Modify `frontend/tests/unit/features/auth/signup-workflow.unit.test.ts`, `frontend/tests/unit/widgets/legal/terms-content.unit.test.tsx`, and `frontend/tests/unit/widgets/legal/scope-reference.unit.test.ts` for pure behavior and copy contracts.
- Add `frontend/tests/unit/widgets/legal/terms-dialog-scroll.unit.test.ts` for the scroll-boundary predicate; the Playwright journey covers the real dialog callback and checkbox state.
- Modify `frontend/tests/e2e/journeys/inspector/terms-and-conditions.e2e.spec.ts` to verify the disabled-until-bottom signup flow.

### Task 1: Add failing validation and legal-copy tests

**Files:**
- Modify: `frontend/tests/unit/features/auth/signup-workflow.unit.test.ts`
- Modify: `frontend/tests/unit/widgets/legal/terms-content.unit.test.tsx`
- Modify: `frontend/tests/unit/widgets/legal/scope-reference.unit.test.ts`

**Interfaces:**
- `validateSignupState` will accept `termsReadToEnd: boolean`.
- The legal sources must contain the same explicit unsupported-capability concepts.

- [x] **Step 1: Extend the signup unit fixture and add the red test.** Add `termsReadToEnd: false` to the invalid fixture, add a case where `acceptedTerms` is true but `termsReadToEnd` is false, and assert the error is `Please open and read the Terms and Conditions through the end before accepting them.`. Set `termsReadToEnd: true` in the valid fixture.
- [x] **Step 2: Add red assertions for the scope boundary.** Assert that both source serializations contain `sick meat`, `pathogens`, `contamination`, `chemical adulteration`, and `non-pork`. Keep the existing freshness vocabulary and device assertions.
- [x] **Step 3: Run the focused unit tests.** Run `npm run test:unit -w frontend -- --test-name-pattern "signup workflow|terms use|terms explain|scope reference"`. Expected: the new assertions fail because the validator signature and copy have not changed yet.

### Task 2: Implement the scroll-completion contract and signup state

**Files:**
- Modify: `frontend/src/widgets/legal/terms-and-conditions-dialog.tsx`
- Modify: `frontend/src/features/auth/model/signup.ts`
- Modify: `frontend/src/features/auth/model/use-signup.ts`

**Interfaces:**
- `TermsAndConditionsDialogProps` gains `onReadToEnd?: () => void`.
- `useSignupPage` returns `termsReadToEnd` and `handleTermsReadToEnd`.
- `validateSignupState` receives `termsReadToEnd` and checks it before `acceptedTerms`.

- [x] **Step 1: Implement scroll-boundary detection.** Add a ref to the scrollable terms container and a callback that calls `onReadToEnd` when `scrollTop + clientHeight >= scrollHeight - 1`. Run the same check once after an opened dialog mounts so content that fits without scrolling is considered fully visible. Add `data-testid="terms-scroll-container"` for deterministic browser/component tests.
- [x] **Step 2: Implement the pure validation rule.** Add the `termsReadToEnd` input and return the exact read-through error before the existing terms-acceptance error.
- [x] **Step 3: Implement hook state and defensive handling.** Add `termsReadToEnd` state initialized to `false`, set it to true from `handleTermsReadToEnd`, pass it to validation, and refuse a checked terms state if the read gate is still false.
- [x] **Step 4: Run the focused unit tests.** Run `npm run test:unit -w frontend -- --test-name-pattern "signup workflow"`. Expected: signup validation tests pass.

### Task 3: Wire the signup UI and add component/E2E regression coverage

**Files:**
- Modify: `frontend/src/pages/auth/components/signup-page-view.tsx`
- Modify: `frontend/tests/component/shared/terms-and-conditions.component.test.tsx` or create `frontend/tests/component/shared/terms-and-conditions-dialog.component.test.tsx`
- Modify: `frontend/tests/e2e/journeys/inspector/terms-and-conditions.e2e.spec.ts`

**Interfaces:**
- The terms checkbox is disabled while `termsReadToEnd` is false.
- The dialog receives `onReadToEnd={handleTermsReadToEnd}`.

- [x] **Step 1: Update the signup UI.** Use the label `I have read the MeatLens Terms and Conditions.`, pass `disabled={!termsReadToEnd}`, add an accessible instruction that the user must open and scroll to the end, and wire the dialog callback.
- [x] **Step 2: Add a scroll-boundary regression test.** Test the extracted predicate with values below the boundary, exactly at the boundary, and an empty/non-measurable container; the end-to-end journey covers the callback wiring.
- [x] **Step 3: Update the signup E2E journey.** Assert the terms checkbox is disabled immediately after loading, open the Terms dialog, set the terms scroll container to its bottom and dispatch a scroll event, then assert the checkbox becomes enabled before checking it. Update existing checkbox locators to the new “I have read” wording.
- [x] **Step 4: Run focused component and E2E tests.** Run `npm run test:component -w frontend -- --test-name-pattern "terms"` and `npm run test:e2e -w frontend -- tests/e2e/journeys/inspector/terms-and-conditions.e2e.spec.ts`. Expected: both pass with the checkbox gate covered.

### Task 4: Align the legal scope and delimitations content

**Files:**
- Modify: `frontend/src/widgets/legal/terms-content.tsx`
- Modify: `frontend/src/widgets/legal/scope-reference.ts`

**Interfaces:**
- Both surfaces describe the same validated scope and exclusions without implying sickness or health-condition scanning.

- [x] **Step 1: Update the Terms scope section.** State that the system is AI-assisted pork freshness screening, supports only `Fresh`, `Not Fresh`, and `Spoiled`, and does not detect/diagnose sick meat, disease, illness, pathogens, contamination, parasites, chemical adulteration, or other health conditions. Keep the laboratory, certification, enforcement, and professional-judgment limitations explicit.
- [x] **Step 2: Update the scope reference basis.** Mirror those exclusions in `system-scope`, `excluded-meat-types`, `operational-delimitations`, and `when-not-to-rely-on-ai-alone` so the in-app page does not broaden the Terms’ scope.
- [x] **Step 3: Run legal unit and component tests.** Run `npm run test:unit -w frontend -- --test-name-pattern "terms|scope reference"` and `npm run test:component -w frontend -- --test-name-pattern "terms"`. Expected: all legal copy assertions pass.

### Task 5: Run the complete relevant frontend quality gates

**Files:**
- No additional files; inspect the final diff and test output.

- [x] **Step 1: Run frontend lint.** Run `npm run lint -w frontend`. Expected: exit code 0.
- [x] **Step 2: Run frontend typecheck.** Run `npm run typecheck -w frontend`. Expected: exit code 0.
- [x] **Step 3: Run frontend architecture checks.** Run `npm run test:architecture -w frontend`. Expected: exit code 0.
- [x] **Step 4: Run the frontend build.** Run `npm run build -w frontend`. Expected: exit code 0.
- [x] **Step 5: Review the final diff and status.** Run `git diff --check`, `git diff --stat`, and `git status --short`; confirm only signup/legal tests, source, and the approved plan/spec are changed.
- [x] **Step 6: Commit implementation changes.** Stage only the relevant frontend files and the plan, then commit with `feat: require reading terms before signup acknowledgement`.
