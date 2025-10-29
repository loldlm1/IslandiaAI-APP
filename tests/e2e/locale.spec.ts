import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function completeSignIn(page: Page) {
  await page.goto("/signin");

  await page.getByLabel(/email/i).fill("isla@example.com");
  await page.getByLabel(/^password/i).fill("password123");
  await page.getByRole("button", { name: /sign in/i }).click();

  await page.waitForURL("**/dashboard");
}

async function captureSignOutLocale(page: Page, graphqlUrl: string) {
  await page.getByRole("button", { name: /isla innovator/i }).click();

  const requestPromise = page.waitForRequest((request) => {
    if (request.url() !== graphqlUrl || request.method() !== "POST") {
      return false;
    }

    try {
      const body = JSON.parse(request.postData() ?? "{}");
      return body.operationName === "SignOut";
    } catch (error) {
      console.warn("Failed to parse GraphQL request body", error);
      return false;
    }
  });

  await page.getByRole("button", { name: /sign out/i }).click();

  const request = await requestPromise;
  const body = JSON.parse(request.postData() ?? "{}");

  return body.locale as string | undefined;
}

function resolveGraphQLEndpoint() {
  const envGraphql = process.env.NEXT_PUBLIC_GRAPHQL_URL;

  if (envGraphql) {
    return envGraphql;
  }

  const port = process.env.PORT ?? "43111";
  return `http://127.0.0.1:${port}/api/mock/graphql`;
}

test.describe("locale propagation", () => {
  test("updates GraphQL requests when the UI locale changes", async ({ page }) => {
    const graphqlUrl = resolveGraphQLEndpoint();

    await completeSignIn(page);

    const defaultLocale = await captureSignOutLocale(page, graphqlUrl);
    expect(defaultLocale).toBe("en");
    await page.waitForURL("**/signin");

    await completeSignIn(page);

    await page.getByRole("combobox", { name: /language/i }).selectOption("es");

    const updatedLocale = await captureSignOutLocale(page, graphqlUrl);
    expect(updatedLocale).toBe("es");
    await page.waitForURL("**/signin");
  });
});
