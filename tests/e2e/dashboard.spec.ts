import { test, expect } from "@playwright/test";

test.describe("dashboard access control", () => {
  test("redirects unauthenticated users to sign in", async ({ page }) => {
    const response = await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    expect(response?.status()).toBe(200);
    await page.waitForURL("**/signin", { timeout: 30000 });
    await expect(page).toHaveURL(/\/signin$/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible({ timeout: 10000 });
  });
});
