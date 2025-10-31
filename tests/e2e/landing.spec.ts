import { expect, test } from "@playwright/test";

import { completeSignIn } from "./support/auth";

test.describe("marketing landing page", () => {
  test("renders marketing experience for guests", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { level: 1, name: /whole order lifecycle/i }),
    ).toBeVisible();

    await expect(page.getByRole("link", { name: /start free trial/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /go to dashboard/i })).toBeVisible();
  });

  test("supports locale switching between English and Spanish", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("combobox", { name: /language/i }).selectOption("es");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /ciclo de pedidos, finalmente sincronizado/i,
      }),
    ).toBeVisible();

    await page.getByRole("combobox", { name: /language/i }).selectOption("en");

    await expect(
      page.getByRole("heading", { level: 1, name: /whole order lifecycle/i }),
    ).toBeVisible();
  });

  test("redirects authenticated users to the dashboard", async ({ page }) => {
    await completeSignIn(page);

    await page.goto("/");
    await page.waitForURL("**/dashboard");
  });
});
