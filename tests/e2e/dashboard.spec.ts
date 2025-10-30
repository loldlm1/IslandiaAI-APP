import { test, expect } from "@playwright/test";

import { completeSignIn } from "./support/auth";
import {
  AUTH_OPERATION_NAMES,
  getAuthServiceDocument,
  mockGraphQLOperation,
  resolveGraphQLEndpoint,
} from "./support/graphql";

test.describe("dashboard access control", () => {
  test("keeps users on the sign-in flow after a failed attempt", async ({ page }) => {
    const graphqlUrl = resolveGraphQLEndpoint();
    const observedOperations: string[] = [];

    page.on("request", (request) => {
      if (!request.url().startsWith(graphqlUrl) || request.method() !== "POST") {
        return;
      }

      const payload = request.postData();

      if (!payload) {
        return;
      }

      try {
        const { operationName } = JSON.parse(payload) as {
          operationName?: string | null;
        };

        if (operationName) {
          observedOperations.push(operationName);
        }
      } catch (error) {
        // Ignore malformed payloads, the assertion below will fail if we never
        // observe the mutation we expect to execute.
      }
    });

    const signInMock = await mockGraphQLOperation(page, AUTH_OPERATION_NAMES.signIn, {
      body: {
        data: {
          signIn: {
            userErrors: [{ message: "Invalid credentials" }],
          },
        },
      },
    });

    const response = await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    expect(response?.status()).toBe(200);
    await page.waitForURL("**/signin", { timeout: 30000 });

    const signInResponsePromise = page.waitForResponse((incomingResponse) => {
      if (!incomingResponse.url().startsWith(graphqlUrl)) {
        return false;
      }

      if (incomingResponse.request().method() !== "POST") {
        return false;
      }

      const body = incomingResponse.request().postData();

      if (!body) {
        return false;
      }

      try {
        const parsed = JSON.parse(body) as { operationName?: string | null };
        return parsed.operationName === AUTH_OPERATION_NAMES.signIn;
      } catch {
        return false;
      }
    });

    await expect(page).toHaveURL(/\/signin$/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible({ timeout: 10000 });

    const [signInResponse] = await Promise.all([
      signInResponsePromise,
      page.evaluate(
        async ({ endpoint, operationName, document }) => {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              operationName,
              query: document,
              variables: {
                input: {
                  credentials: {
                    email: "invalid@example.com",
                    password: "totally-wrong-password",
                  },
                },
              },
            }),
          });

          if (!response.ok) {
            throw new Error(`SignIn mutation failed: ${response.status}`);
          }

          return response.json();
        },
        {
          endpoint: graphqlUrl,
          operationName: AUTH_OPERATION_NAMES.signIn,
          document: getAuthServiceDocument(AUTH_OPERATION_NAMES.signIn),
        },
      ),
    ]);

    const payload = (await signInResponse.json()) as {
      data?: { signIn?: { userErrors?: { message?: string | null }[] | null } | null } | null;
    };

    const userErrors = payload.data?.signIn?.userErrors ?? [];
    expect(userErrors.length).toBeGreaterThan(0);
    expect(observedOperations).toContain(AUTH_OPERATION_NAMES.signIn);

    await expect(page).toHaveURL(/\/signin$/, { timeout: 10000 });

    await signInMock();
  });

  test("loads the viewer details for the authenticated session", async ({ page }) => {
    const graphqlUrl = resolveGraphQLEndpoint();
    const credentials = await completeSignIn(page);

    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10000 });

    const payload = (await page.evaluate(
      async ({ endpoint, operationName, document }) => {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            operationName,
            query: document,
          }),
        });

        return response.json();
      },
      {
        endpoint: graphqlUrl,
        operationName: AUTH_OPERATION_NAMES.viewer,
        document: getAuthServiceDocument(AUTH_OPERATION_NAMES.viewer),
      },
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
