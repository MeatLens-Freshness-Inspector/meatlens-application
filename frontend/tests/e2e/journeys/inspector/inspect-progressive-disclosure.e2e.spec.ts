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
