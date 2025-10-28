import {
  AuthRequestError,
  GRAPHQL_ENDPOINT,
  fetchViewer,
  login,
  logout,
  register,
} from "./api";
import type {
  AuthTokens,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from "./types";

describe("auth API", () => {
  let originalFetch: typeof fetch | undefined;
  let fetchMock: jest.MockedFunction<typeof fetch>;

  const userFixture: AuthUser = {
    id: "user-id",
    email: "person@example.com",
    name: "Ada Lovelace",
  };

  const tokensFixture: AuthTokens = {
    accessToken: "access-token",
    refreshToken: "refresh-token",
  };

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  beforeEach(() => {
    fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    if (originalFetch) {
      global.fetch = originalFetch;
    }
  });

  const mockGraphQLResponse = <TData>(
    json: TData,
    overrides: Partial<Response> = {},
  ): Response => {
    return {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(json),
      ...overrides,
    } as unknown as Response;
  };

  it("logs in with the expected GraphQL payload and maps tokens and user", async () => {
    const payload: LoginPayload = {
      email: "person@example.com",
      password: "correct horse battery staple",
    };

    fetchMock.mockResolvedValue(
      mockGraphQLResponse({
        data: {
          login: {
            accessToken: tokensFixture.accessToken,
            refreshToken: tokensFixture.refreshToken,
            user: userFixture,
          },
        },
      }),
    );

    const result = await login(payload);

    expect(fetchMock).toHaveBeenCalledWith(
      GRAPHQL_ENDPOINT,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }),
    );

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init?.body ?? "") as string);
    expect(body.operationName).toBe("Login");
    expect(body.query).toContain("mutation Login");
    expect(body.variables).toEqual({ input: payload });

    expect(result).toEqual({
      tokens: tokensFixture,
      user: userFixture,
    });
  });

  it("registers a user and sends the correct mutation variables", async () => {
    const payload: RegisterPayload = {
      email: "person@example.com",
      name: "Ada Lovelace",
      password: "correct horse battery staple",
      organizationName: "Analytical Engines, LLC",
    };

    fetchMock.mockResolvedValue(
      mockGraphQLResponse({
        data: {
          register: {
            user: userFixture,
          },
        },
      }),
    );

    const result = await register(payload);

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init?.body ?? "") as string);
    expect(body.operationName).toBe("Register");
    expect(body.query).toContain("mutation Register");
    expect(body.variables).toEqual({ input: payload });

    expect(result).toEqual({ user: userFixture });
  });

  it("logs out with the provided access token", async () => {
    fetchMock.mockResolvedValue(
      mockGraphQLResponse({
        data: {
          logout: { success: true },
        },
      }),
    );

    const result = await logout({ accessToken: tokensFixture.accessToken });

    const [, init] = fetchMock.mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers).toEqual({
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokensFixture.accessToken}`,
    });
    const body = JSON.parse((init?.body ?? "") as string);
    expect(body.operationName).toBe("Logout");
    expect(body.query).toContain("mutation Logout");

    expect(result).toEqual({ success: true });
  });

  it("fetches the viewer with the expected access token", async () => {
    fetchMock.mockResolvedValue(
      mockGraphQLResponse({
        data: {
          viewer: userFixture,
        },
      }),
    );

    const result = await fetchViewer(tokensFixture.accessToken);

    const [, init] = fetchMock.mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers).toEqual({
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokensFixture.accessToken}`,
    });
    const body = JSON.parse((init?.body ?? "") as string);
    expect(body.operationName).toBe("Viewer");
    expect(body.query).toContain("query Viewer");

    expect(result).toEqual(userFixture);
  });

  it("surfaces HTTP errors with status and GraphQL details", async () => {
    const errors = [{ message: "Unauthorized" }];

    fetchMock.mockResolvedValue(
      mockGraphQLResponse(
        { errors },
        {
          ok: false,
          status: 401,
        },
      ),
    );

    expect.assertions(3);
    try {
      await login({ email: "person@example.com", password: "wrong" });
    } catch (error) {
      expect(error).toBeInstanceOf(AuthRequestError);
      expect((error as AuthRequestError).status).toBe(401);
      expect((error as AuthRequestError).details).toEqual(errors);
    }
  });

  it("throws with GraphQL error responses", async () => {
    const errors = [{ message: "Email already taken" }];

    fetchMock.mockResolvedValue(
      mockGraphQLResponse({ errors }, { status: 200 }),
    );

    await expect(register({
      email: "person@example.com",
      name: "Ada",
      password: "secret",
    })).rejects.toMatchObject({
      name: "AuthRequestError",
      details: errors,
    });
  });

  it("throws when the response does not contain data", async () => {
    fetchMock.mockResolvedValue(mockGraphQLResponse({ data: undefined }));

    await expect(fetchViewer(tokensFixture.accessToken)).rejects.toBeInstanceOf(AuthRequestError);
  });

  it("throws when JSON parsing fails", async () => {
    const jsonError = new SyntaxError("Unexpected token");

    fetchMock.mockResolvedValue(
      mockGraphQLResponse({}, {
        json: jest.fn().mockRejectedValue(jsonError),
      }),
    );

    await expect(login({ email: "person@example.com", password: "secret" })).rejects.toMatchObject({
      name: "AuthRequestError",
      status: 200,
    });
  });
});
