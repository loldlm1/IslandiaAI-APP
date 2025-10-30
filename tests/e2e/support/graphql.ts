import type { Page, Request, Route } from "@playwright/test";

const DEFAULT_PORT = process.env.PORT ?? "43111";
const DEFAULT_BASE_URL = `http://127.0.0.1:${DEFAULT_PORT}`;
const DEFAULT_PROXY_URL = `${DEFAULT_BASE_URL}/api/graphql`;
const DEFAULT_UPSTREAM_URL = `${DEFAULT_BASE_URL}/api/mock/graphql`;

function toAbsolute(url: string): string {
  try {
    return new URL(url).toString();
  } catch {
    return new URL(url, DEFAULT_BASE_URL).toString();
  }
}

export function isUsingRealGraphQL(): boolean {
  const upstream = process.env.GRAPHQL_SERVER_URL?.toLowerCase();
  if (upstream) {
    return !upstream.includes("/api/mock/");
  }

  const publicEndpoint = process.env.NEXT_PUBLIC_GRAPHQL_URL?.toLowerCase();
  if (!publicEndpoint) {
    return false;
  }

  if (publicEndpoint.includes("/api/mock/")) {
    return false;
  }

  return !publicEndpoint.endsWith("/api/graphql");
}

export function resolveGraphQLEndpoint(): string {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? DEFAULT_PROXY_URL;
  return toAbsolute(endpoint);
}

export function resolveGraphQLUpstream(): string {
  const endpoint =
    process.env.GRAPHQL_SERVER_URL ??
    process.env.NEXT_PUBLIC_GRAPHQL_URL ??
    DEFAULT_UPSTREAM_URL;
  return toAbsolute(endpoint);
}

interface MockGraphQLOperationOptions {
  status?: number;
  headers?: Record<string, string>;
  body: unknown;
}

type MockTeardown = () => Promise<void>;

export async function mockGraphQLOperation(
  page: Page,
  operationName: string,
  { body, headers, status = 200 }: MockGraphQLOperationOptions,
): Promise<MockTeardown> {
  if (isUsingRealGraphQL()) {
    return async () => {};
  }

  const graphqlUrl = resolveGraphQLEndpoint();

  const handler = async (route: Route, request: Request) => {
    if (request.method() !== "POST") {
      await route.continue();
      return;
    }

    const rawBody = request.postData();

    if (!rawBody) {
      await route.continue();
      return;
    }

    let payload: { operationName?: string };
    try {
      payload = JSON.parse(rawBody) as { operationName?: string };
    } catch {
      await route.continue();
      return;
    }

    if (payload.operationName !== operationName) {
      await route.continue();
      return;
    }

    await route.fulfill({
      status,
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
        ...headers,
      },
    });
  };

  await page.route(graphqlUrl, handler);

  return async () => {
    await page.unroute(graphqlUrl, handler);
  };
}

export function waitForGraphQLRequest(
  page: Page,
  operationName: string,
): Promise<Request> {
  const graphqlUrl = resolveGraphQLEndpoint();

  return page.waitForRequest((request) => {
    if (request.url() !== graphqlUrl) {
      return false;
    }

    if (request.method() !== "POST") {
      return false;
    }

    const rawBody = request.postData();
    if (!rawBody) {
      return false;
    }

    try {
      const payload = JSON.parse(rawBody) as { operationName?: string };
      return payload.operationName === operationName;
    } catch {
      return false;
    }
  });
}
