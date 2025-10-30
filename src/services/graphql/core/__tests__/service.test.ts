import { createGraphQLService, resolveServerGraphQLEndpoint } from "../index";
import { DEFAULT_LOCALE } from "@/src/lib/locale/constants";

describe("GraphQL core service", () => {
  let originalFetch: typeof fetch | undefined;
  let fetchMock: jest.MockedFunction<typeof fetch>;
  const originalEnv = { ...process.env };
  const globalScope = global as typeof globalThis & {
    window?: unknown;
    document?: unknown;
  };
  const originalWindow = globalScope.window;
  const originalDocument = globalScope.document;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  beforeEach(() => {
    fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.fetch = fetchMock;

    Reflect.deleteProperty(globalScope, "window");
    Reflect.deleteProperty(globalScope, "document");

    process.env.NEXT_PUBLIC_GRAPHQL_URL = "/api/graphql";
    process.env.GRAPHQL_SERVER_URL = "http://mock.api/graphql";
  });

  afterEach(() => {
    jest.clearAllMocks();

    if (originalEnv.NEXT_PUBLIC_GRAPHQL_URL === undefined) {
      delete process.env.NEXT_PUBLIC_GRAPHQL_URL;
    } else {
      process.env.NEXT_PUBLIC_GRAPHQL_URL = originalEnv.NEXT_PUBLIC_GRAPHQL_URL;
    }

    if (originalEnv.GRAPHQL_SERVER_URL === undefined) {
      delete process.env.GRAPHQL_SERVER_URL;
    } else {
      process.env.GRAPHQL_SERVER_URL = originalEnv.GRAPHQL_SERVER_URL;
    }
  });

  afterAll(() => {
    if (originalWindow === undefined) {
      Reflect.deleteProperty(globalScope, "window");
    } else {
      globalScope.window = originalWindow;
    }

    if (originalDocument === undefined) {
      Reflect.deleteProperty(globalScope, "document");
    } else {
      globalScope.document = originalDocument;
    }

    if (originalFetch) {
      global.fetch = originalFetch;
    }
  });

  const mockJsonResponse = <T,>(
    body: T,
    overrides: Partial<Response> = {},
  ): Response => {
    return {
      ok: overrides.ok ?? true,
      status: overrides.status ?? 200,
      text: jest
        .fn()
        .mockImplementation(() =>
          overrides.text ? overrides.text() : Promise.resolve(JSON.stringify(body)),
        ),
      headers:
        overrides.headers instanceof Headers ? overrides.headers : new Headers(overrides.headers),
      ...overrides,
    } as unknown as Response;
  };

  it("executes GraphQL requests and returns the payload", async () => {
    const service = createGraphQLService();
    fetchMock.mockResolvedValue(
      mockJsonResponse({
        data: {
          viewer: { id: "user-1" },
        },
      }),
    );

    const result = await service.execute({
      operationName: "Viewer",
      query: "query Viewer { viewer { id } }",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      resolveServerGraphQLEndpoint(),
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      }),
    );

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init?.body ?? "") as string);
    expect(body.operationName).toBe("Viewer");
    expect(body.query).toContain("Viewer");
    expect(body.locale).toBe(DEFAULT_LOCALE);

    expect(result).toEqual({
      data: { viewer: { id: "user-1" } },
      setCookies: [],
    });
  });

  it("uses the provided locale when executing requests", async () => {
    const service = createGraphQLService();
    fetchMock.mockResolvedValue(
      mockJsonResponse({
        data: {
          viewer: { id: "user-1" },
        },
      }),
    );

    await service.execute(
      {
        operationName: "Viewer",
        query: "query Viewer { viewer { id } }",
      },
      { locale: "es" },
    );

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init?.body ?? "") as string);
    expect(body.locale).toBe("es");
  });

  it("extracts cookies from the GraphQL response", async () => {
    const service = createGraphQLService();
    fetchMock.mockResolvedValue(
      mockJsonResponse(
        {
          data: {
            viewer: { id: "user-1" },
          },
        },
        {
          headers: new Headers([
            ["set-cookie", "session=abc123; Path=/; HttpOnly"],
            ["set-cookie", "refresh=xyz; Path=/"],
          ]),
        },
      ),
    );

    const result = await service.execute({
      operationName: "Viewer",
      query: "query Viewer { viewer { id } }",
    });

    expect(result.setCookies).toEqual([
      "session=abc123; Path=/; HttpOnly",
      "refresh=xyz; Path=/",
    ]);
  });

  it("surfaces transport errors with normalized top-level errors", async () => {
    const service = createGraphQLService();
    fetchMock.mockResolvedValue(
      mockJsonResponse(
        {
          errors: [
            {
              message: "You must be signed in to perform this action.",
              path: ["viewer"],
            },
          ],
        },
        {
          ok: false,
          status: 401,
        },
      ),
    );

    await expect(
      service.execute({ operationName: "Viewer", query: "query Viewer { viewer { id } }" }),
    ).rejects.toMatchObject({
      name: "GraphQLRequestError",
      status: 401,
      details: [
        {
          message: "You must be signed in to perform this action.",
          path: ["viewer"],
        },
      ],
      topLevelErrors: [
        {
          message: "You must be signed in to perform this action.",
          path: ["viewer"],
          kind: "AUTHENTICATION_REQUIRED",
        },
      ],
    });
  });

  it("throws when the response omits a data payload", async () => {
    const service = createGraphQLService();
    fetchMock.mockResolvedValue(mockJsonResponse({}, { status: 200, ok: true }));

    await expect(
      service.execute({ operationName: "Viewer", query: "query Viewer { viewer { id } }" }),
    ).rejects.toMatchObject({
      name: "GraphQLRequestError",
      message: "GraphQL response did not include data",
    });
  });
});
