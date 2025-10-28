import { defineConfig } from "@playwright/test";

const PORT = process.env.PORT ?? "43111";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "on-first-retry",
  },
  webServer: {
    command: "yarn dev",
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    env: {
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "test-secret",
      NEXTAUTH_URL: `http://127.0.0.1:${PORT}`,
    },
  },
});
