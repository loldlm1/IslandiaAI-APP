import { test, expect } from "@playwright/test";

import { completeSignIn } from "./support/auth";
import { resolveGraphQLEndpoint } from "./support/graphql";

test.describe("dashboard access control", () => {
  test("redirects unauthenticated users to sign in", async ({ page }) => {
    const response = await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    expect(response?.status()).toBe(200);
    await page.waitForURL("**/signin", { timeout: 30000 });
    await expect(page).toHaveURL(/\/signin$/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible({ timeout: 10000 });
  });

  test("loads the viewer details for the authenticated session", async ({ page }) => {
    const graphqlUrl = resolveGraphQLEndpoint();
    const credentials = await completeSignIn(page);

    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10000 });

    const payload = (await page.evaluate(
      async ({ endpoint }) => {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            operationName: "Viewer",
            query: "query Viewer { viewer { id email name } }",
          }),
        });

        return response.json();
      },
      { endpoint: graphqlUrl },
    )) as {
      data?: { viewer?: { email?: string | null; name?: string | null } | null } | null;
    };

    const viewer = payload.data?.viewer;
    expect(viewer?.email).toBeTruthy();

    expect(viewer?.email).toBe(credentials.email);

    if (viewer?.name) {
      expect(viewer.name).not.toHaveLength(0);
    }
  });
});
