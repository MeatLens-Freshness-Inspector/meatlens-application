# Privacy Policy Reading Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Require signup users to read the full Privacy Policy before the privacy acknowledgement checkbox can be selected or signup can proceed.

**Architecture:** Reuse the existing legal-dialog scroll-bottom predicate and Terms dialog interaction. Add privacy-specific read-through state to the signup workflow, pass a callback into `PrivacyPolicyDialog`, and cover the UI and validation boundaries with existing unit and E2E suites.

**Tech Stack:** React 18, TypeScript, Radix Dialog/Checkbox, Playwright, Node test runner, npm workspaces.

## Global Constraints

- Preserve the existing Terms and Conditions gate and privacy acceptance behavior.
- Do not change the signup request payload or backend contract.
- Keep the checkbox disabled until the privacy dialog reaches its scroll boundary.
- Run targeted checks first, then the complete relevant local CI gates.
- Do not weaken, skip, focus, or remove existing tests.

---

### Task 1: Add the privacy validation boundary test

**Files:**
- Modify: `frontend/tests/unit/features/auth/signup-workflow.unit.test.ts`
- Modify: `frontend/src/features/auth/model/signup.ts`

**Interfaces:**
- `validateSignupState` consumes `privacyReadToEnd: boolean` alongside the existing signup state.
- The validation function produces the existing terms-first error, then a privacy-read-through error, then the existing acceptance/organization errors.

- [ ] **Step 1: Extend the test inputs with `privacyReadToEnd` and add the failing privacy boundary assertion.**

  Add `privacyReadToEnd: false` to existing validation fixtures. Add this assertion after the terms-read-through case:

  ```ts
  assert.equal(
    validateSignupState(
      {
        acceptedPrivacy: true,
        acceptedTerms: true,
        termsReadToEnd: true,
        privacyReadToEnd: false,
        accessCode: "code",
        reportOrganization: "dti",
      },
      validOrganization,
    ),
    "Please open and read the Privacy Policy through the end before accepting it.",
  );
  ```

- [ ] **Step 2: Run the focused unit test to verify the new assertion fails for the missing implementation.**

  Run:

  ```powershell
  npm run test:unit -w frontend -- tests/unit/features/auth/signup-workflow.unit.test.ts
  ```

  Expected: the existing validation function rejects the new input shape or returns `null` instead of the privacy read-through error.

- [ ] **Step 3: Add the minimal validation field and ordered guard.**

  Update `validateSignupState` to accept `privacyReadToEnd: boolean` and insert this guard immediately after the terms guard:

  ```ts
  if (!input.privacyReadToEnd) {
    return "Please open and read the Privacy Policy through the end before accepting it.";
  }
  ```

  Update every caller in `use-signup.ts` with the current privacy read-through state.

- [ ] **Step 4: Run the focused unit test and confirm it passes.**

  Run the same command from Step 2. Expected: all signup workflow assertions pass.

- [ ] **Step 5: Commit the validation change.**

  ```powershell
  git add frontend/src/features/auth/model/signup.ts frontend/src/features/auth/model/use-signup.ts frontend/tests/unit/features/auth/signup-workflow.unit.test.ts
  git commit -m "test: require privacy policy read-through before signup"
  ```

### Task 2: Gate the privacy checkbox on dialog scroll completion

**Files:**
- Modify: `frontend/src/widgets/legal/privacy-policy-dialog.tsx`
- Modify: `frontend/src/features/auth/model/use-signup.ts`
- Modify: `frontend/src/pages/auth/components/signup-page-view.tsx`

**Interfaces:**
- `PrivacyPolicyDialog` accepts optional `onReadToEnd?: () => void`.
- `useSignupPage` exposes `privacyReadToEnd` and `handlePrivacyReadToEnd`.
- The signup view passes the callback and disables the privacy checkbox while `privacyReadToEnd` is false.

- [ ] **Step 1: Add the privacy dialog callback and scroll tracking.**

  Mirror `TermsAndConditionsDialog`: add a scroll-container ref, a callback that calls `isTermsScrollAtBottom`, an effect that checks an already-bottom-sized container when opened, and `onScroll={notifyIfReadToEnd}`. Add `data-testid="privacy-scroll-container"` for deterministic E2E access.

- [ ] **Step 2: Add privacy read-through state and callback to the signup hook.**

  Add:

  ```ts
  const [privacyReadToEnd, setPrivacyReadToEnd] = useState(false);

  const handlePrivacyReadToEnd = () => {
    setPrivacyReadToEnd(true);
  };
  ```

  Include `privacyReadToEnd` in validation input and return both it and the handler from the hook.

- [ ] **Step 3: Disable the privacy checkbox and wire the dialog callback.**

  Set `disabled={!privacyReadToEnd}` on the privacy checkbox. Add the same concise locked-state guidance used for Terms, adjusted to Privacy Policy wording. Pass `onReadToEnd={handlePrivacyReadToEnd}` to `PrivacyPolicyDialog`.

- [ ] **Step 4: Run typecheck and the signup unit test.**

  Run:

  ```powershell
  npm run typecheck -w frontend
  npm run test:unit -w frontend -- tests/unit/features/auth/signup-workflow.unit.test.ts
  ```

  Expected: both commands exit 0.

- [ ] **Step 5: Commit the UI and workflow implementation.**

  ```powershell
  git add frontend/src/widgets/legal/privacy-policy-dialog.tsx frontend/src/features/auth/model/use-signup.ts frontend/src/pages/auth/components/signup-page-view.tsx
  git commit -m "feat: require reading privacy policy before signup"
  ```

### Task 3: Add E2E coverage for the privacy reading gate

**Files:**
- Modify: `frontend/tests/e2e/journeys/inspector/terms-and-conditions.e2e.spec.ts`

**Interfaces:**
- The signup journey proves the privacy checkbox is disabled before reading, enabled after the dialog reaches the bottom, and accepted before the account request is made.

- [ ] **Step 1: Add a `readPrivacyBeforeSignup` helper beside the existing Terms helper.**

  Use this behavior:

  ```ts
  async function readPrivacyBeforeSignup(page: Page) {
    const privacyCheckbox = page.getByRole("checkbox", {
      name: /i have read the meatlens privacy policy/i,
    });
    await expect(privacyCheckbox).toBeDisabled();

    await page.getByRole("button", { name: /view privacy policy/i }).click();
    const privacyDialog = page.getByRole("dialog");
    await expect(privacyDialog).toBeVisible();
    await privacyDialog.getByTestId("privacy-scroll-container").evaluate((element) => {
      element.scrollTop = element.scrollHeight;
      element.dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    await privacyDialog.getByRole("button", { name: "Close" }).click();
    await expect(privacyCheckbox).toBeEnabled();
    await privacyCheckbox.click();
  }
  ```

- [ ] **Step 2: Replace direct privacy checkbox clicks in both signup tests with the helper.**

  This makes both successful-account and missing-organization flows exercise the required read-through behavior.

- [ ] **Step 3: Run the focused E2E suite.**

  Run:

  ```powershell
  npm run test:e2e -w frontend -- tests/e2e/journeys/inspector/terms-and-conditions.e2e.spec.ts
  ```

  Expected: all tests in the file pass, including the initial disabled state and post-scroll enabled state.

- [ ] **Step 4: Commit the regression coverage.**

  ```powershell
  git add frontend/tests/e2e/journeys/inspector/terms-and-conditions.e2e.spec.ts
  git commit -m "test: cover privacy policy signup reading gate"
  ```

### Task 4: Run the relevant CI gates and inspect the final diff

**Files:**
- Inspect only; no additional source changes expected.

- [ ] **Step 1: Run frontend lint and typecheck.**

  ```powershell
  npm run lint -w frontend -- --quiet
  npm run typecheck -w frontend
  ```

- [ ] **Step 2: Run frontend unit, component, integration, and architecture suites.**

  ```powershell
  npm run test:unit -w frontend
  npm run test:component -w frontend
  npm run test:integration -w frontend
  npm run test:architecture -w frontend
  ```

- [ ] **Step 3: Run the full root test gate and build.**

  ```powershell
  npm test
  npm run build -w frontend
  ```

- [ ] **Step 4: Inspect status and diff for scope.**

  ```powershell
  git status --short
  git diff origin/master...HEAD --stat
  git log --oneline origin/master..HEAD
  ```

  Expected: only the privacy gate spec/plan, signup workflow, privacy dialog/view, and signup tests are included; no generated report artifacts or unrelated changes are present.

- [ ] **Step 5: Commit any necessary final documentation-only adjustments, then report exact verification output.**
