import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { buildSignOutSuccess } from "@/tests/mocks/services/auth";

import { completeSignIn } from "./support/auth";
import {
  AUTH_OPERATION_NAMES,
  mockGraphQLOperation,
  resolveGraphQLEndpoint,
} from "./support/graphql";

async function captureSignOutLocale(page: Page, graphqlUrl: string) {
  const userMenuTrigger = page
    .locator("button.dropdown-toggle")
    .filter({ has: page.locator("span.font-medium") });

  await userMenuTrigger.first().click();

  const requestPromise = page.waitForRequest((request) => {
    if (request.url() !== graphqlUrl || request.method() !== "POST") {
      return false;
    }

    try {
      const body = JSON.parse(request.postData() ?? "{}");
      return body.operationName === AUTH_OPERATION_NAMES.signOut;
    } catch (error) {
      console.warn("Failed to parse GraphQL request body", error);
      return false;
    }
  });

  const teardown = await mockGraphQLOperation(page, AUTH_OPERATION_NAMES.signOut, {
    body: buildSignOutSuccess(),
  });

  try {
    await page.getByRole("button", { name: /sign out/i }).click();

    const request = await requestPromise;
    const body = JSON.parse(request.postData() ?? "{}");

    return body.locale as string | undefined;
  } finally {
    await teardown();
  }
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
