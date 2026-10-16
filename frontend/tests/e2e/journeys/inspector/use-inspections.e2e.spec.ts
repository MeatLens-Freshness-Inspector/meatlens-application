import { test, expect } from "@playwright/test";
import { fulfillEncryptedRoute } from "../../../support/fixtures/transport";
import {
  mockCommonApi,
  seedInspectionHistoryCache,
  seedSignedInSession,
  type ApiSpy,
} from "../../../support/fixtures/app";

test("signed-in history fetches inspections scoped to the current user", async ({ page }) => {
  const spies: ApiSpy[] = [];
  await seedSignedInSession(page, { userId: "user-1" });
  await mockCommonApi(page, { userId: "user-1" }, spies);

  await page.goto("/history");
  await expect(page).toHaveURL(/\/history$/);
  await expect.poll(() => spies.find((spy) => spy.url.includes("/api/inspections?"))).toBeTruthy();

  const inspectionRequest = spies.find((spy) => spy.url.includes("/api/inspections?"));
  expect(inspectionRequest).toBeTruthy();
  expect(inspectionRequest?.url).toContain("limit=50");
  expect(inspectionRequest?.url).toContain("offset=0");
  expect(inspectionRequest?.url).toContain("scope=mine");
});

test("keeps the open record action inside the inspection card from 300px to 350px", async ({ page }) => {
  await seedSignedInSession(page, { userId: "user-1" });
  await mockCommonApi(page, { userId: "user-1" });

  for (const width of [300, 340, 350]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/history");

    const card = page.getByTestId("inspection-card-layout").first();
    const openRecord = page.getByTestId("inspection-open-record").first();
    await expect(card).toBeVisible();
    await expect(openRecord).toBeVisible();

    const cardBox = await card.boundingBox();
    const openRecordBox = await openRecord.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(openRecordBox).not.toBeNull();

    expect(openRecordBox!.x).toBeGreaterThanOrEqual(cardBox!.x);
    expect(openRecordBox!.x + openRecordBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width);
  }
});

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

test("history query does not run when no user is signed in", async ({ page }) => {
  let inspectionCalls = 0;

  await page.route("**/api/analysis/health", async (route) => {
    await fulfillEncryptedRoute(route, {
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });

  await page.route("**/api/inspections?**", async (route) => {
    inspectionCalls += 1;
    await fulfillEncryptedRoute(route, {
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.goto("/history");
  await page.waitForURL("**/login");
  expect(inspectionCalls).toBe(0);
});

test("history renders cached inspections when opened offline", async ({ context, page }) => {
  await seedSignedInSession(page, { userId: "user-1" });
  await mockCommonApi(page, { userId: "user-1" });
  const now = new Date().toISOString();
  await seedInspectionHistoryCache(page, {
    userId: "user-1",
    inspections: [
      {
        id: "inspection-offline-1",
        user_id: "user-1",
        meat_type: "pork",
        classification: "warning",
        confidence_score: 88,
        flagged_deviations: ["Surface moisture"],
        explanation: "Cached inspection history entry",
        image_url: null,
        location: "North Market",
        location_latitude: null,
        location_longitude: null,
        stall_number: "12-A",
        meat_inspection_certificate_proof: null,
        meat_expiry_date: null,
        storage_correct: null,
        light_color_correct: null,
        light_color_observed: null,
        area_clean: null,
        inspection_decision_source: "ai",
        protocol_spoiled_reason: null,
        inspector_notes: null,
        captured_at: now,
        created_at: now,
        updated_at: now,
      },
    ],
  });

  await page.goto("/inspect");
  await expect(page.getByRole("heading", { name: "Inspect" })).toBeVisible();
  await page.unroute("**/api/**");
  await context.setOffline(true);
  await expect(page.getByText(/You're offline/i)).toBeVisible();
  await page.getByRole("link", { name: "History" }).click();

  await expect(page).toHaveURL(/\/history$/);
  const cachedInspectionCard = page.getByTestId("inspection-card-layout").first();
  await expect(cachedInspectionCard).toContainText("North Market");
  await expect(cachedInspectionCard).toContainText("88%");
});
