import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import {
  buildSignOutSuccess,
  buildSignUpErrors,
  buildSignUpSuccess,
} from "@/tests/mocks/graphql";

import { completeSignIn, registerAccountForE2E } from "./support/auth";
import {
  isUsingRealGraphQL,
  mockGraphQLOperation,
  resolveGraphQLEndpoint,
  waitForGraphQLRequest,
} from "./support/graphql";

function generateUniqueEmail(): string {
  return `playwright+${randomUUID().replace(/-/g, "")}@example.com`;
}

async function fillSignUpForm(
  page: Page,
  overrides: Partial<{ name: string; email: string; password: string; confirmPassword: string }> = {},
) {
  const name = overrides.name ?? "Jane Doe";
  const email = overrides.email ?? generateUniqueEmail();
  const password = overrides.password ?? "password123";
  const confirmPassword = overrides.confirmPassword ?? password;

  await page.goto("/signup");

  await page.getByLabel(/full name/i).fill(name);
  await page.getByLabel(/^email/i).fill(email);
  await page.getByLabel(/^password/i).fill(password);
  await page.getByLabel(/confirm password/i).fill(confirmPassword);

  return { name, email, password, confirmPassword };
}

test.describe("authentication flows", () => {
  test("signs in and lands on the dashboard", async ({ page }) => {
    await completeSignIn(page);

    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10000 });
    await expect(page.getByText("Coming soon")).toBeVisible({ timeout: 10000 });
  });

  test("signs out and returns to the sign-in page", async ({ page }) => {
    await completeSignIn(page);

    const teardown = await mockGraphQLOperation(page, "SignOut", {
      body: buildSignOutSuccess(),
    });

    try {
      await page.goto("/signout");
      await page.waitForURL("**/signin", { timeout: 30000 });

      await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible({ timeout: 10000 });
    } finally {
      await teardown();
    }
  });

  test("redirects authenticated users away from the sign-in form", async ({ page }) => {
    await completeSignIn(page);

    await page.goto("/signin");
    await page.waitForURL("**/dashboard", { timeout: 30000 });

    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10000 });
  });

  test("registers a new account and redirects back to sign in", async ({ page }) => {
    const { email, name } = await fillSignUpForm(page);
    const signUpRequestPromise = waitForGraphQLRequest(page, "SignUp");
    const teardown = await mockGraphQLOperation(page, "SignUp", {
      body: buildSignUpSuccess({ email, name }),
    });

    try {
      await page.getByRole("button", { name: /create account/i }).click();

      await page.waitForURL("**/signin?registered=1", { timeout: 30000 });

      await expect(page).toHaveURL(/\/signin\?registered=1$/);
      await expect(
        page.getByText("Registration successful. Sign in to continue."),
      ).toBeVisible({ timeout: 10000 });

      const request = await signUpRequestPromise;
      expect(request.url()).toBe(resolveGraphQLEndpoint());
    } finally {
      await teardown();
    }
  });

  test("surfaces GraphQL validation errors during registration", async ({ page }) => {
    const duplicateEmail = generateUniqueEmail();
    if (isUsingRealGraphQL()) {
      await registerAccountForE2E({
        email: duplicateEmail,
        password: "password123",
      });
    }

    const signUpRequestPromise = waitForGraphQLRequest(page, "SignUp");
    const teardown = await mockGraphQLOperation(page, "SignUp", {
      body: buildSignUpErrors([
        { message: "Email is already registered", path: ["attributes", "email"] },
      ]),
    });

    try {
      await fillSignUpForm(page, { email: duplicateEmail });

      await page.getByRole("button", { name: /create account/i }).click();

      await expect(page).toHaveURL(/\/signup$/);
      await expect(page.getByText("Email is already registered")).toBeVisible({ timeout: 10000 });

      const request = await signUpRequestPromise;
      expect(request.url()).toBe(resolveGraphQLEndpoint());
    } finally {
      await teardown();
    }
  });
});
