import { test, expect } from "@playwright/test";

test.describe("dashboard access control", () => {
  test("redirects unauthenticated users to sign in", async ({ page }) => {
    const response = await page.goto("/dashboard");

    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/signin$/);
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });
});
