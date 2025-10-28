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
    tokenType: "Bearer",
    expiresIn: 7_200,
    createdAt: 1_701_610_002,
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

  const mockJsonResponse = (
    body: unknown,
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
      ...overrides,
    } as unknown as Response;
  };

  it("logs in with the expected payload and maps OAuth tokens", async () => {
    const payload: LoginPayload = {
      email: "person@example.com",
      password: "correct horse battery staple",
    };

    fetchMock.mockResolvedValue(
      mockJsonResponse({
        access_token: tokensFixture.accessToken,
        refresh_token: tokensFixture.refreshToken,
        token_type: tokensFixture.tokenType,
        expires_in: tokensFixture.expiresIn,
        created_at: tokensFixture.createdAt,
      }),
    );

    const result = await login(payload);

    expect(fetchMock).toHaveBeenCalledWith(
      new URL("/oauth/token", GRAPHQL_ENDPOINT).toString(),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }),
    );

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init?.body ?? "") as string);
    expect(body).toEqual({
      grant_type: "password",
      username: payload.email,
      email: payload.email,
      password: payload.password,
    });

    expect(result).toEqual(tokensFixture);
  });

  it("registers a user and sends the correct payload", async () => {
    const payload: RegisterPayload = {
      email: "person@example.com",
      name: "Ada Lovelace",
      password: "correct horse battery staple",
      organizationName: "Analytical Engines, LLC",
    };

    fetchMock.mockResolvedValue(
      mockJsonResponse({ user: userFixture }),
    );

    const result = await register(payload);

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init?.body ?? "") as string);
    expect(body).toEqual({
      user: {
        email: payload.email,
        name: payload.name,
        password: payload.password,
        organization_name: payload.organizationName,
      },
    });

    expect(result).toEqual({ user: userFixture });
  });

  it("logs out with the provided access token", async () => {
    fetchMock.mockResolvedValue(
      mockJsonResponse({ success: true }),
    );

    const result = await logout({ accessToken: tokensFixture.accessToken });

    const [, init] = fetchMock.mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers).toEqual({
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokensFixture.accessToken}`,
    });
    const body = JSON.parse((init?.body ?? "") as string);
    expect(body).toEqual({ token: tokensFixture.accessToken });

    expect(result).toEqual({ success: true });
  });

  it("fetches the viewer with the expected access token", async () => {
    fetchMock.mockResolvedValue(
      mockJsonResponse({
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

  it("surfaces HTTP errors with status and details", async () => {
    fetchMock.mockResolvedValue(
      mockJsonResponse(
        {
          error: "invalid_grant",
          error_description: "Invalid credentials",
        },
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
      expect((error as AuthRequestError).details).toEqual([
        { message: "Invalid credentials" },
        { message: "invalid_grant" },
      ]);
    }
  });

  it("includes validation errors from registration responses", async () => {
    fetchMock.mockResolvedValue(
      mockJsonResponse(
        { errors: { email: ["has already been taken"] } },
        { ok: false, status: 422 },
      ),
    );

    await expect(
      register({
        email: "person@example.com",
        name: "Ada",
        password: "secret",
      }),
    ).rejects.toMatchObject({
      name: "AuthRequestError",
      status: 422,
      details: [{ message: "email has already been taken" }],
    });
  });

  it("throws when the login response omits token fields", async () => {
    fetchMock.mockResolvedValue(mockJsonResponse({}));

    await expect(
      login({ email: "person@example.com", password: "secret" }),
    ).rejects.toBeInstanceOf(AuthRequestError);
  });

  it("treats empty logout responses as success", async () => {
    fetchMock.mockResolvedValue(
      mockJsonResponse("", {
        text: jest.fn().mockResolvedValue(""),
      }),
    );

    await expect(logout({ accessToken: tokensFixture.accessToken })).resolves.toEqual({
      success: true,
    });
  });

  it("throws when JSON parsing fails", async () => {
    const jsonError = new SyntaxError("Unexpected token");

    fetchMock.mockResolvedValue(
      mockJsonResponse(null, {
        text: jest.fn().mockRejectedValue(jsonError),
      }),
    );

    await expect(login({ email: "person@example.com", password: "secret" })).rejects.toMatchObject({
      name: "AuthRequestError",
      status: 200,
      message: "Unable to read authentication response",
    });
  });
});
