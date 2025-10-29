import { defineConfig } from "@playwright/test";

const PORT = process.env.PORT ?? "43111";
const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ??
  `http://127.0.0.1:${PORT}/api/mock/graphql`;

const isUsingRealGraphQL = Boolean(process.env.NEXT_PUBLIC_GRAPHQL_URL);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: isUsingRealGraphQL ? 90_000 : 60_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "on-first-retry",
  },
  webServer: {
    command: "yarn dev",
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "test-secret",
      NEXTAUTH_URL: `http://127.0.0.1:${PORT}`,
      NEXT_PUBLIC_GRAPHQL_URL: GRAPHQL_URL,
    },
  },
});
