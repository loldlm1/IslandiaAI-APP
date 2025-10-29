import type { Page } from "@playwright/test";

const MOCK_EMAIL = "isla@example.com";
const MOCK_PASSWORD = "password123";

function resolveSignInCredentials() {
  const email = process.env.E2E_SIGNIN_EMAIL;
  const password = process.env.E2E_SIGNIN_PASSWORD;
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL;

  if (graphqlUrl && (!email || !password)) {
    throw new Error(
      "E2E_SIGNIN_EMAIL and E2E_SIGNIN_PASSWORD must be set when NEXT_PUBLIC_GRAPHQL_URL is configured to run E2E tests against the real API."
    );
  }

  return {
    email: email ?? MOCK_EMAIL,
    password: password ?? MOCK_PASSWORD,
  };
}

export async function completeSignIn(page: Page) {
  const credentials = resolveSignInCredentials();

  await page.goto("/signin");

  await page.getByLabel(/email/i).fill(credentials.email);
  await page.getByLabel(/^password/i).fill(credentials.password);
  await page.getByRole("button", { name: /sign in/i }).click();

  await page.waitForURL("**/dashboard", { timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {
    // Network idle may not be reached if there are ongoing requests.
  });
}
