/** @jest-environment node */

import {
  resolveClientGraphQLEndpoint,
  resolveGraphQLEndpoint,
  resolveGraphQLGatewayEndpoint,
  resolveServerGraphQLEndpoint,
} from "../endpoints";

const ORIGINAL_ENV = process.env;
const GLOBAL_SCOPE = global as typeof globalThis & { window?: unknown };
const ORIGINAL_WINDOW = GLOBAL_SCOPE.window;

function resetEnv(): void {
  process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
}

describe("GraphQL endpoint resolution", () => {
  beforeEach(() => {
    resetEnv();
    delete process.env.NEXT_PUBLIC_GRAPHQL_URL;
    delete process.env.GRAPHQL_SERVER_URL;
    delete process.env.NEXTAUTH_URL;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;

    if (ORIGINAL_WINDOW === undefined) {
      Reflect.deleteProperty(GLOBAL_SCOPE, "window");
    } else {
      GLOBAL_SCOPE.window = ORIGINAL_WINDOW;
    }
  });

  it("returns the default gateway when no environment variables are set", () => {
    expect(resolveGraphQLGatewayEndpoint()).toBe("/api/graphql");
    expect(resolveClientGraphQLEndpoint()).toBe("/api/graphql");
  });

  it("prefers the configured gateway endpoint for the client", () => {
    process.env.NEXT_PUBLIC_GRAPHQL_URL = "https://example.com/graphql";

    expect(resolveGraphQLGatewayEndpoint()).toBe("https://example.com/graphql");
    expect(resolveClientGraphQLEndpoint()).toBe("https://example.com/graphql");
  });

  it("falls back to the gateway when no server endpoint is configured", () => {
    process.env.NEXT_PUBLIC_GRAPHQL_URL = "/api/graphql";
    process.env.NEXTAUTH_URL = "https://app.islandia.example";

    expect(resolveServerGraphQLEndpoint()).toBe("https://app.islandia.example/api/graphql");
  });

  it("uses the upstream server endpoint when provided", () => {
    process.env.GRAPHQL_SERVER_URL = "https://api.islandia.example/graphql";

    expect(resolveServerGraphQLEndpoint()).toBe("https://api.islandia.example/graphql");
  });

  it("switches between client and server endpoints based on runtime context", () => {
    const developmentBase = `http://127.0.0.1:${process.env.PORT ?? "43111"}`;
    const expectedServerEndpoint = new URL("/api/graphql", developmentBase).toString();

    const previousWindow = GLOBAL_SCOPE.window;
    GLOBAL_SCOPE.window = undefined;

    // Server runtime
    expect(resolveGraphQLEndpoint()).toBe(expectedServerEndpoint);

    // Simulate browser runtime
    GLOBAL_SCOPE.window = {};
    expect(resolveGraphQLEndpoint()).toBe("/api/graphql");

    if (previousWindow === undefined) {
      Reflect.deleteProperty(GLOBAL_SCOPE, "window");
    } else {
      GLOBAL_SCOPE.window = previousWindow;
    }
  });
});
