import { test, expect } from "@playwright/test";

import { mockCommonApi, seedSignedInSession } from "../../../support/fixtures/app";

test("keeps history focused while leaving secondary actions discoverable", async ({ page }) => {
  await page.setViewportSize({ width: 340, height: 800 });
  await seedSignedInSession(page, { userId: "user-1" });
  await mockCommonApi(page, { userId: "user-1" });
  await page.goto("/history");

  await expect(page.getByRole("heading", { name: "History" })).toBeVisible();
  await expect(page.getByLabel("Find a saved record")).toBeVisible();
  await expect(page.getByRole("button", { name: /Filter results/i })).toBeVisible();
  await expect(page.getByLabel("Show results")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Show documentation photos" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Show totals and trends" })).toBeVisible();
  await expect(page.getByText("Classification Mix")).toHaveCount(0);
  await expect(page.getByText("Recent Activity by Month")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Export all inspections as PDF/i })).toBeVisible();

  await page.getByRole("button", { name: /Filter results/i }).click();
  await expect(page.getByLabel("Show results")).toBeVisible();

  await page.getByRole("button", { name: "Show totals and trends" }).click();
  await expect(page.getByText("Classification Mix")).toBeVisible();
  await expect(page.getByText("Recent Activity by Month")).toBeVisible();
});
