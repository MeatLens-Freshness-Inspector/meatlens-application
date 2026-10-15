/**
 * camera-quality-integration.spec.ts
 *
 * Tests for the ImageQualityResult integration in the CameraCapture UI.
 * These scenarios protect the field capture flow while quality checks evolve.
 *
 * These are E2E-style Playwright tests that exercise the camera capture
 * component via the /inspect page. They mock image quality via
 * addInitScript so we can inject controlled quality outcomes without
 * needing a real camera or specific pixel values.
 *
 * Invariants under test:
 *   1. Good image â†’ "Analyze Sample" is enabled, no quality banner shown.
 *   2. FAIL quality â†’ "Analyze Sample" is disabled, error banner shown, retake only.
 *   3. WARNING quality â†’ amber warning banner shown, both "Retake" and
 *      "Analyze Sample" remain available.
 *   4. Warning: clicking "Analyze Sample" captures and proceeds to analysis.
 *   5. Fail: clicking "Analyze Sample" is blocked; only retake resets the flow.
 */

import { test, expect, type Page } from "@playwright/test";
import {
  mockCommonApi,
  seedDeveloperOptionsSession,
  seedSignedInSession,
} from "../../../support/fixtures/app";
import { futureDateOnly } from "../../../support/factories/dates";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Installs a mock camera with a controllable canvas image.
 */
async function installMockCamera(page: Page): Promise<void> {
  await page.addInitScript(() => {
    if (!navigator.mediaDevices) {
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: {},
      });
    }

    const getUserMediaMock = async (): Promise<MediaStream> => {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#888888";
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(100, 100, 440, 280);
        ctx.fillStyle = "#444444";
        ctx.fillRect(200, 180, 240, 120);
      }
      const stream = canvas.captureStream(15);
      const track = stream.getVideoTracks()[0];
      Object.defineProperty(track, "getCapabilities", { configurable: true, value: () => ({}) });
      Object.defineProperty(track, "getSettings", { configurable: true, value: () => ({}) });
      Object.defineProperty(track, "applyConstraints", {
        configurable: true,
        value: async () => undefined,
      });
      return stream;
    };

    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: getUserMediaMock,
    });
  });
}

type QualityScenario = "pass" | "warning" | "fail";

/**
 * Patches window.__mockImageQualityResult so that CameraCapture reads the
 * controlled outcome (test seam â€” only active in test environments).
 *
 * Also patches window.__mockLegacyQualityAccepted to bypass the legacy
 * assessFileQuality meat-detection gate so the PNG test fixture is accepted.
 */
async function installQualityMock(page: Page, scenario: QualityScenario): Promise<void> {
  await page.addInitScript((s: QualityScenario) => {
    const results: Record<QualityScenario, object> = {
      pass: {
        status: "pass",
        issues: [],
        metrics: { width: 640, height: 480, brightness: 128, sharpness: 200 },
        canProceed: true,
      },
      warning: {
        status: "warning",
        issues: [
          {
            code: "TOO_DARK",
            message: "Image is underexposed (brightness 45.0). Consider improving lighting.",
            severity: "warning",
          },
        ],
        metrics: { width: 640, height: 480, brightness: 45, sharpness: 200 },
        canProceed: true,
      },
      fail: {
        status: "fail",
        issues: [
          {
            code: "LOW_RESOLUTION",
            message: "Image resolution is too low (200\u00d7150). Retake at higher resolution.",
            severity: "fail",
          },
          {
            code: "TOO_DARK",
            message: "Image is too dark (brightness 5.0). Improve lighting.",
            severity: "fail",
          },
        ],
        metrics: { width: 200, height: 150, brightness: 5, sharpness: 2 },
        canProceed: false,
      },
    };
    (window as Window & { __mockImageQualityResult?: object }).__mockImageQualityResult =
      results[s];
    // Allow any file through the legacy meat-detection gate in tests.
    (window as Window & { __mockLegacyQualityAccepted?: boolean }).__mockLegacyQualityAccepted =
      true;
  }, scenario);
}

async function installImageDecodeFailure(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(window, "createImageBitmap", {
      configurable: true,
      value: async () => {
        throw new Error("simulated image decode failure");
      },
    });
  });
}

/**
 * Uploads a file through the "Use Camera App" input.
 */
async function uploadViaCameraApp(page: Page): Promise<void> {
  const fileInput = page.locator('input[type="file"][capture="environment"]');
  await fileInput.setInputFiles("public/android-chrome-192x192.png");
}

async function resolveCssColor(page: Page, colorExpression: string): Promise<string> {
  return page.evaluate((expression) => {
    const probe = document.createElement("div");
    probe.style.color = expression;
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, colorExpression);
}

async function completePreScanChecklist(page: Page): Promise<void> {
  await page.getByLabel(/stall number/i).fill("12-A");
  await page.getByLabel(/meat inspection certificate proof/i).fill("CERT-77");
  await page.getByLabel(/meat expiry date|expiry of meat/i).fill(futureDateOnly());
  await page.getByRole("radio", { name: "Storage Correct: Yes" }).click();
  await page.getByRole("radio", { name: "Light Color Correct: Yes" }).click();
  await page.getByRole("radio", { name: "Area Clean: Yes" }).click();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Camera quality integration", () => {
  test("good quality: capture is accepted without a second Analyze Sample tap", async ({ page }) => {
    await installQualityMock(page, "pass");
    await seedSignedInSession(page, { userId: "user-1" });
    await mockCommonApi(page, { userId: "user-1" });

    await page.goto("/inspect");
    await completePreScanChecklist(page);
    await uploadViaCameraApp(page);

    // The captured image should be displayed
    await expect(page.locator("img[alt='Captured']")).toBeVisible();

    // No quality warning banner
    await expect(page.getByTestId("quality-banner")).not.toBeVisible();

    // Native phone-camera captures start analysis automatically.
    await expect(page.getByRole("button", { name: /analyze sample/i })).toHaveCount(0);
  });

  test("warning quality: amber warning banner is shown while the capture proceeds automatically", async ({ page }) => {
    await installQualityMock(page, "warning");
    await seedSignedInSession(page, { userId: "user-1" });
    await mockCommonApi(page, { userId: "user-1" });

    await page.goto("/inspect");
    await completePreScanChecklist(page);
    await uploadViaCameraApp(page);

    // Quality warning banner must be visible
    await expect(page.getByTestId("quality-banner")).toBeVisible();

    // Banner should indicate this is a warning
    await expect(page.getByTestId("quality-banner")).toContainText(/warning|quality|lighting/i);

    // Retake remains available, but the old second Analyze Sample tap is gone.
    await expect(page.getByRole("button", { name: /retake/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /analyze sample/i })).toHaveCount(0);
  });

  test("warning quality: light mode keeps banner text readable while preserving warning accent", async ({ page }) => {
    await installQualityMock(page, "warning");
    await seedSignedInSession(page, { userId: "user-1" });
    await mockCommonApi(page, { userId: "user-1" });

    await page.goto("/inspect");
    await completePreScanChecklist(page);
    await uploadViaCameraApp(page);

    const banner = page.getByTestId("quality-banner");
    await expect(banner).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    const expectedBodyColor = await resolveCssColor(page, "hsl(var(--foreground))");
    await expect(banner).toHaveCSS("color", expectedBodyColor);

    const expectedAccentColor = await resolveCssColor(page, "hsl(var(--warning))");
    await expect(banner.getByText("Quality Warning", { exact: true })).toHaveCSS("color", expectedAccentColor);
  });

  test("warning quality: capture starts the analysis transition automatically", async ({ page }) => {
    await installQualityMock(page, "warning");
    await seedSignedInSession(page, { userId: "user-1" });
    await mockCommonApi(page, { userId: "user-1" });

    await page.goto("/inspect");
    await completePreScanChecklist(page);
    await uploadViaCameraApp(page);

    await expect(page.getByTestId("quality-banner")).toBeVisible();

    // The native capture itself should accept the sample and start the existing analysis flow.
    await expect(page.getByRole("button", { name: /analyze sample/i })).toHaveCount(0);
    await expect(page.getByRole("status")).toContainText(/getting the scan ready|analyzing sample/i, {
      timeout: 8_000,
    });
  });

  test("fail quality: rejected native capture stays visible and only Retake is actionable", async ({ page }) => {
    await installQualityMock(page, "fail");
    await seedSignedInSession(page, { userId: "user-1" });
    await mockCommonApi(page, { userId: "user-1" });

    await page.goto("/inspect");
    await completePreScanChecklist(page);
    await uploadViaCameraApp(page);

    // Quality error banner must be visible
    await expect(page.getByTestId("quality-banner")).toBeVisible();

    // The banner should describe the failure
    await expect(page.getByTestId("quality-banner")).toContainText(
      /resolution|dark|blurry|bright|quality/i
    );

    // The rejected native image remains visible so the inspector can understand and retake it.
    await expect(page.locator("img[alt='Captured']")).toBeVisible();
    await expect(page.getByRole("button", { name: /analyze sample/i })).toHaveCount(0);

    // Retake should remain enabled
    await expect(page.getByRole("button", { name: /retake/i })).toBeEnabled();
  });

  test("fail quality: clicking Retake clears the capture and hides the quality banner", async ({ page }) => {
    await installQualityMock(page, "fail");
    await seedSignedInSession(page, { userId: "user-1" });
    await mockCommonApi(page, { userId: "user-1" });

    await page.goto("/inspect");
    await completePreScanChecklist(page);
    await uploadViaCameraApp(page);

    await expect(page.getByTestId("quality-banner")).toBeVisible();

    // Retake resets the UI
    await page.getByRole("button", { name: /retake/i }).click();

    // After retake, the captured image preview is gone and banner disappears
    await expect(page.locator("img[alt='Captured']")).not.toBeVisible();
    await expect(page.getByTestId("quality-banner")).not.toBeVisible();
  });

  test("native image decode failure keeps the capture actionable", async ({ page }) => {
    await installImageDecodeFailure(page);
    await seedSignedInSession(page, { userId: "user-1" });
    await mockCommonApi(page, { userId: "user-1" });

    await page.goto("/inspect");
    await completePreScanChecklist(page);
    await uploadViaCameraApp(page);

    await expect(page.locator("img[alt='Captured']")).toBeVisible();
    await expect(page.getByTestId("quality-banner")).toContainText(/unable to check image quality/i);
    await expect(page.getByRole("button", { name: /analyze sample/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /retake/i })).toBeEnabled();
  });

  test("fail quality: only Retake remains actionable after automatic quality rejection", async ({ page }) => {
    await installQualityMock(page, "fail");
    await seedSignedInSession(page, { userId: "user-1" });
    await mockCommonApi(page, { userId: "user-1" });

    await page.goto("/inspect");
    await completePreScanChecklist(page);
    await uploadViaCameraApp(page);

    // A rejected native capture never exposes a second analysis action.
    await expect(page.getByRole("button", { name: /analyze sample/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /retake/i })).toBeEnabled();
  });

  test("in-app cam path: quality banner appears after capture with warning result", async ({ page }) => {
    await installQualityMock(page, "warning");
    await installMockCamera(page);
    await seedSignedInSession(page, { userId: "admin-1", isAdmin: true, isDeveloper: true });
    await seedDeveloperOptionsSession(page, "admin-1");
    await mockCommonApi(page, { userId: "admin-1", isAdmin: true, isDeveloper: true, developerOptionsValid: true });

    await page.goto("/inspect");
    await completePreScanChecklist(page);

    // Open the developer-only in-app stream and capture
    await page.getByRole("button", { name: /in-app cam/i }).click();
    await expect(page.getByRole("button", { name: /capture/i })).toBeVisible({ timeout: 5_000 });
    await page.getByRole("button", { name: /capture/i }).click();

    // After capture, the preview should appear
    await expect(page.locator("img[alt='Captured']")).toBeVisible({ timeout: 5_000 });

    // Quality banner should show for a warning result
    await expect(page.getByTestId("quality-banner")).toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole("button", { name: /analyze sample/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /retake/i })).toBeVisible();
  });
});
