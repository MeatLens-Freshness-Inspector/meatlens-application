# Documentation Photo Narrow Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the documentation-photo card's `View details` action inside the card at 300–350px mobile widths while matching the inspection-card responsive layout.

**Architecture:** Reuse the existing documentation-photo card and change only its mobile metrics row classes. The metrics row will wrap, constrain its width, and place the action on a full-width second row; `sm` and wider screens retain the current compact inline action. A Playwright geometry regression will exercise the real rendered card at 300px, 340px, and 350px.

**Tech Stack:** React, Tailwind CSS utility classes, Playwright, Node test runner, TypeScript, ESLint.

## Global Constraints

- Only the documentation-photo card styles and frontend regression coverage change.
- No backend, database, API, offline-sync, or PDF behavior changes.
- Preserve documentation-specific content, disabled state, detail dialog, and image preview behavior.
- Do not change the existing inspection-card responsive behavior.

---

### Task 1: Add the failing narrow-width documentation-card regression

**Files:**
- Modify: `frontend/tests/e2e/journeys/inspector/use-inspections.e2e.spec.ts`

**Interfaces:**
- Consumes: existing `seedSignedInSession`, `mockCommonApi`, `page`, and `@playwright/test` helpers.
- Produces: a regression test that proves the documentation-photo action stays within its card at the target widths.

- [ ] **Step 1: Write the failing test**

Add this test after the existing narrow inspection-card test. It mocks one saved documentation-photo API response, opens history at each target width, and compares the rendered bounding boxes:

```ts
test("keeps documentation photo actions inside narrow cards from 300px to 350px", async ({ page }) => {
  await seedSignedInSession(page, { userId: "user-1" });
  await mockCommonApi(page, { userId: "user-1" });
  await page.route("**/api/documentation-photos**", async (route) => {
    await fulfillEncryptedRoute(route, {
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "documentation-photo-1",
          user_id: "user-1",
          client_submission_id: "submission-documentation-photo-1",
          image_url: "https://example.test/documentation-photo.jpg",
          location: "Ikot Palengke",
          location_latitude: null,
          location_longitude: null,
          stall_number: "A-12",
          captured_at: "2026-10-16T08:00:00.000Z",
          created_at: "2026-10-16T08:00:00.000Z",
          updated_at: "2026-10-16T08:00:00.000Z",
        },
      ]),
    });
  });

  for (const width of [300, 340, 350]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/history");

    const card = page.getByTestId("documentation-photo-card-layout").first();
    const viewDetails = card.getByRole("button", { name: "View details" });
    await expect(card).toBeVisible();
    await expect(viewDetails).toBeVisible();

    const cardBox = await card.boundingBox();
    const viewDetailsBox = await viewDetails.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(viewDetailsBox).not.toBeNull();
    expect(viewDetailsBox!.x).toBeGreaterThanOrEqual(cardBox!.x);
    expect(viewDetailsBox!.x + viewDetailsBox!.width)
      .toBeLessThanOrEqual(cardBox!.x + cardBox!.width);
  }
});
```

The route response uses the production `DocumentationPhoto` shape, so the test renders a real saved documentation-photo card rather than testing class strings alone.

- [ ] **Step 2: Run the new test and verify the expected failure**

Run from `frontend/`:

```bash
npx playwright test tests/e2e/journeys/inspector/use-inspections.e2e.spec.ts --grep "keeps documentation photo actions inside narrow cards" --reporter=line
```

Expected: the test reaches the bounding-box assertion and fails because the existing non-wrapping documentation metrics row places `View details` outside the card.

### Task 2: Match the inspection-card mobile action layout

**Files:**
- Modify: `frontend/src/widgets/history/ui/documentation-photo-section.tsx:214-232`

**Interfaces:**
- Consumes: the existing `DocumentationPhotoListItem` entry state and `View details` handler.
- Produces: unchanged documentation-card behavior with a wrapped, contained mobile action.

- [ ] **Step 1: Apply the minimal responsive class change**

Change the metrics wrapper from:

```tsx
className="col-span-2 flex items-end justify-between gap-3 border-t border-border/60 pt-2 sm:col-span-1 sm:block sm:border-t-0 sm:pt-0 sm:text-right"
```

to:

```tsx
className="col-span-2 flex min-w-0 flex-wrap items-end justify-between gap-3 border-t border-border/60 pt-2 sm:col-span-1 sm:block sm:border-t-0 sm:pt-0 sm:text-right"
```

Change the action classes from:

```tsx
className="mt-2 h-9 w-full rounded-lg px-3 text-xs sm:w-auto"
```

to:

```tsx
className="mt-2 h-9 w-full min-w-0 basis-full rounded-lg px-3 text-xs sm:basis-auto sm:w-auto"
```

Do not alter the click handler, disabled state, dialog, image preview, or documentation details.

- [ ] **Step 2: Run the regression and focused unit tests**

Run from `frontend/`:

```bash
npx playwright test tests/e2e/journeys/inspector/use-inspections.e2e.spec.ts --grep "keeps documentation photo actions inside narrow cards" --reporter=line
npx tsx --test tests/unit/widgets/history/documentation-photo-section.unit.test.tsx
```

Expected: the browser regression passes at 300px, 340px, and 350px, and all documentation-photo unit tests pass.

- [ ] **Step 3: Run the focused history journey and repository gates**

Run:

```bash
npx playwright test tests/e2e/journeys/inspector/use-inspections.e2e.spec.ts --reporter=line
npm run typecheck
npm run lint
git diff --check
```

Expected: all tests pass, typecheck exits 0, lint exits 0 with only the repository's pre-existing warnings, and `git diff --check` reports no whitespace errors.

- [ ] **Step 4: Commit the implementation**

Stage only the implementation and regression test:

```bash
git add frontend/src/widgets/history/ui/documentation-photo-section.tsx frontend/tests/e2e/journeys/inspector/use-inspections.e2e.spec.ts
git commit -m "fix: keep documentation actions inside narrow cards"
```

Do not stage the unrelated modified backend files.
