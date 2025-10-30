import { defineConfig } from "@playwright/test";

const PORT = process.env.PORT ?? "43111";
const DEFAULT_PROXY_ENDPOINT = "/api/graphql";
const DEFAULT_UPSTREAM_URL = `http://127.0.0.1:${PORT}/api/mock/graphql`;

const GRAPHQL_PROXY_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? DEFAULT_PROXY_ENDPOINT;

const GRAPHQL_SERVER_URL =
  process.env.GRAPHQL_SERVER_URL ?? DEFAULT_UPSTREAM_URL;

const normalize = (value: string | undefined) => value?.toLowerCase() ?? "";

const isUsingRealGraphQL = (() => {
  const upstream = normalize(process.env.GRAPHQL_SERVER_URL);
  if (upstream) {
    return !upstream.includes("/api/mock/");
  }

  const publicEndpoint = normalize(process.env.NEXT_PUBLIC_GRAPHQL_URL);
  if (!publicEndpoint) {
    return false;
  }

  if (publicEndpoint.includes("/api/mock/")) {
    return false;
  }

  return !publicEndpoint.endsWith("/api/graphql");
})();

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
      NEXT_PUBLIC_GRAPHQL_URL: GRAPHQL_PROXY_URL,
      GRAPHQL_SERVER_URL,
    },
  },
});
