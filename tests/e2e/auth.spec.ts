import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function completeSignIn(page: Page) {
  await page.goto("/signin");

  await page.getByLabel(/email/i).fill("isla@example.com");
  await page.getByLabel(/^password/i).fill("password123");
  await page.getByRole("button", { name: /sign in/i }).click();

  await page.waitForURL("**/dashboard", { timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {
    // Network idle may not be reached if there are ongoing requests
  });
}

test.describe("authentication flows", () => {
  test("signs in and lands on the dashboard", async ({ page }) => {
    await completeSignIn(page);

    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10000 });
    await expect(page.getByText("Coming soon")).toBeVisible({ timeout: 10000 });
  });

  test("signs out and returns to the sign-in page", async ({ page }) => {
    await completeSignIn(page);

    await page.goto("/signout");
    await page.waitForURL("**/signin", { timeout: 30000 });

    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible({ timeout: 10000 });
  });

  test("redirects authenticated users away from the sign-in form", async ({ page }) => {
    await completeSignIn(page);

    await page.goto("/signin");
    await page.waitForURL("**/dashboard", { timeout: 30000 });

    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10000 });
  });
});
