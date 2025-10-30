import { randomUUID } from "node:crypto";

import { faker } from "@faker-js/faker";
import type { Page } from "@playwright/test";

import { isUsingRealGraphQL, resolveGraphQLEndpoint } from "./graphql";

const MOCK_EMAIL = "admin@example.com";
const MOCK_PASSWORD = "password123";

export type SignInCredentials = {
  email: string;
  password: string;
};

const SIGN_UP_MUTATION = /* GraphQL */ `
  mutation SignUp($input: SignUpInput!) {
    signUp(input: $input) {
      userErrors {
        message
      }
    }
  }
`;

let generatedCredentialsPromise: Promise<SignInCredentials> | null = null;

async function registerAccount(credentials: SignInCredentials): Promise<void> {
  const response = await fetch(resolveGraphQLEndpoint(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      operationName: "SignUp",
      query: SIGN_UP_MUTATION,
      variables: {
        input: {
          attributes: {
            email: credentials.email,
            name: faker.person.fullName(),
            password: credentials.password,
            passwordConfirmation: credentials.password,
          },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to register E2E credentials: ${response.status} ${response.statusText}`,
    );
  }

  const payload = (await response.json()) as {
    data?: {
      signUp?: { userErrors?: { message: string }[] | null } | null;
    } | null;
    errors?: { message?: string }[] | null;
  };

  if (payload.errors?.length) {
    const messages = payload.errors
      .map((error) => error?.message)
      .filter((message): message is string => Boolean(message))
      .join(", ");

    throw new Error(`Failed to register E2E credentials: ${messages}`);
  }

  const userErrors = payload.data?.signUp?.userErrors ?? [];

  if (userErrors.length > 0) {
    const messages = userErrors
      .map((error) => error.message)
      .filter((message): message is string => Boolean(message))
      .join(", ");

    throw new Error(`Failed to register E2E credentials: ${messages}`);
  }
}

export async function registerAccountForE2E(
  credentials: SignInCredentials,
): Promise<void> {
  if (!isUsingRealGraphQL()) {
    return;
  }

  await registerAccount(credentials);
}

async function resolveSignInCredentials(): Promise<SignInCredentials> {
  if (!isUsingRealGraphQL()) {
    return {
      email: MOCK_EMAIL,
      password: MOCK_PASSWORD,
    };
  }

  if (!generatedCredentialsPromise) {
    generatedCredentialsPromise = (async () => {
      const uniqueIdentifier = randomUUID().replace(/-/g, "");
      const credentials: SignInCredentials = {
        email: faker.internet
          .email({
            firstName: "playwright",
            lastName: uniqueIdentifier.slice(0, 12),
            provider: "example.com",
          })
          .toLowerCase(),
        password: faker.internet.password({ length: 16 }),
      };

      await registerAccount(credentials);

      return credentials;
    })();
  }

  return generatedCredentialsPromise;
}

export async function completeSignIn(
  page: Page,
  credentials?: SignInCredentials,
): Promise<SignInCredentials> {
  const resolvedCredentials =
    credentials ?? (await resolveSignInCredentials());

  await page.goto("/signin");

  await page.getByLabel(/email/i).fill(resolvedCredentials.email);
  await page.getByLabel(/^password/i).fill(resolvedCredentials.password);
  await page.getByRole("button", { name: /sign in/i }).click();

  await page.waitForURL("**/dashboard", { timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {
    // Network idle may not be reached if there are ongoing requests.
  });

  return resolvedCredentials;
}
