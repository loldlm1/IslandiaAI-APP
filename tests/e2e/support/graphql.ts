import type { Page, Request, Route } from "@playwright/test";

const DEFAULT_PORT = process.env.PORT ?? "43111";
const DEFAULT_GRAPHQL_URL = `http://127.0.0.1:${DEFAULT_PORT}/api/mock/graphql`;

export function isUsingRealGraphQL(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GRAPHQL_URL);
}

export function resolveGraphQLEndpoint(): string {
  return process.env.NEXT_PUBLIC_GRAPHQL_URL ?? DEFAULT_GRAPHQL_URL;
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
  if (!isUsingRealGraphQL()) {
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
