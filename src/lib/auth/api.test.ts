import {
  AuthRequestError,
  GRAPHQL_ENDPOINT,
  fetchViewer,
  signIn,
  signOut,
  signUp,
} from "./api";
import type { AuthUser, SignInPayload, SignUpPayload, UserError } from "./types";
import { DEFAULT_LOCALE } from "@/src/lib/locale/constants";

describe("auth API", () => {
  let originalFetch: typeof fetch | undefined;
  let fetchMock: jest.MockedFunction<typeof fetch>;

  const userFixture: AuthUser = {
    id: "user-id",
    email: "person@example.com",
    name: "Ada Lovelace",
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
      headers: overrides.headers instanceof Headers ? overrides.headers : new Headers(overrides.headers),
      ...overrides,
    } as unknown as Response;
  };

  it("signs in with nested credentials and returns the viewer", async () => {
    const payload: SignInPayload = {
      email: "person@example.com",
      password: "correct horse battery staple",
    };

    fetchMock.mockResolvedValue(
      mockJsonResponse({
        data: {
          signIn: {
            user: userFixture,
            userErrors: [],
          },
        },
      }),
    );

    const result = await signIn(payload);

    expect(fetchMock).toHaveBeenCalledWith(
      GRAPHQL_ENDPOINT,
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      }),
    );

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init?.body ?? "") as string);
    expect(body.operationName).toBe("SignIn");
    expect(body.query).toContain("mutation SignIn");
    expect(body.locale).toBe(DEFAULT_LOCALE);
    expect(body.variables).toEqual({
      input: {
        credentials: {
          email: payload.email,
          password: payload.password,
        },
      },
    });

    expect(result).toEqual({ user: userFixture, userErrors: [], setCookies: [] });
  });

  it("returns authentication cookies from the sign-in response", async () => {
    const payload: SignInPayload = {
      email: "person@example.com",
      password: "correct horse battery staple",
    };

    fetchMock.mockResolvedValue(
      mockJsonResponse(
        {
          data: {
            signIn: {
              user: userFixture,
              userErrors: [],
            },
          },
        },
        {
          headers: new Headers([
            ["set-cookie", "islandia_session=abc123; Path=/; HttpOnly"],
            ["set-cookie", "refresh_token=xyz; Path=/"],
          ]),
        },
      ),
    );

    const result = await signIn(payload);

    expect(result.setCookies).toEqual([
      "islandia_session=abc123; Path=/; HttpOnly",
      "refresh_token=xyz; Path=/",
    ]);
  });

  it("allows overriding the locale for sign-in requests", async () => {
    fetchMock.mockResolvedValue(
      mockJsonResponse({
        data: {
          signIn: {
            user: userFixture,
            userErrors: [],
          },
        },
      }),
    );

    await signIn({ email: "person@example.com", password: "correct" }, { locale: "es" });

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init?.body ?? "") as string);
    expect(body.locale).toBe("es");
  });

  it("returns sign-in user errors without throwing", async () => {
    const userErrors: UserError[] = [
      { message: "Invalid credentials", path: ["credentials", "password"] },
    ];

    fetchMock.mockResolvedValue(
      mockJsonResponse({
        data: {
          signIn: {
            user: null,
            userErrors,
          },
        },
      }),
    );

    const result = await signIn({ email: "person@example.com", password: "wrong" });

    expect(result).toEqual({ user: null, userErrors, setCookies: [] });
  });

  it("throws when the sign-in payload is missing", async () => {
    fetchMock.mockResolvedValue(mockJsonResponse({ data: { signIn: null } }));

    await expect(signIn({ email: "user@example.com", password: "secret" })).rejects.toBeInstanceOf(
      AuthRequestError,
    );
  });

  it("signs up with nested attributes", async () => {
    const payload: SignUpPayload = {
      email: "person@example.com",
      name: "Ada Lovelace",
      password: "correct horse battery staple",
      passwordConfirmation: "correct horse battery staple",
    };

    fetchMock.mockResolvedValue(
      mockJsonResponse({
        data: {
          signUp: {
            user: userFixture,
            userErrors: [],
          },
        },
      }),
    );

    const result = await signUp(payload);

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init?.body ?? "") as string);
    expect(body.operationName).toBe("SignUp");
    expect(body.query).toContain("mutation SignUp");
    expect(body.locale).toBe(DEFAULT_LOCALE);
    expect(body.variables).toEqual({
      input: {
        attributes: {
          email: payload.email,
          name: payload.name,
          password: payload.password,
          passwordConfirmation: payload.passwordConfirmation,
        },
      },
    });

    expect(result).toEqual({ user: userFixture, userErrors: [], setCookies: [] });
  });

  it("exposes sign-up user errors", async () => {
    const userErrors: UserError[] = [
      { message: "Email has already been taken", path: ["attributes", "email"] },
    ];

    fetchMock.mockResolvedValue(
      mockJsonResponse({
        data: {
          signUp: {
            user: null,
            userErrors,
          },
        },
      }),
    );

    const result = await signUp({
      email: "person@example.com",
      name: "Ada",
      password: "secret",
      passwordConfirmation: "secret",
    });

    expect(result).toEqual({ user: null, userErrors, setCookies: [] });
  });

  it("signs out using an empty input payload", async () => {
    fetchMock.mockResolvedValue(
      mockJsonResponse({
        data: {
          signOut: {
            user: null,
            userErrors: [],
          },
        },
      }),
    );

    const result = await signOut();

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init?.body ?? "") as string);
    expect(body.operationName).toBe("SignOut");
    expect(body.query).toContain("mutation SignOut");
    expect(body.locale).toBe(DEFAULT_LOCALE);
    expect(body.variables).toEqual({ input: {} });

    expect(result).toEqual({ user: null, userErrors: [], setCookies: [] });
  });

  it("includes the overridden locale when signing out", async () => {
    fetchMock.mockResolvedValue(
      mockJsonResponse({
        data: {
          signOut: {
            user: null,
            userErrors: [],
          },
        },
      }),
    );

    await signOut({ locale: "es" });

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init?.body ?? "") as string);
    expect(body.locale).toBe("es");
  });

  it("fetches the viewer using the cookie-backed session", async () => {
    fetchMock.mockResolvedValue(
      mockJsonResponse({
        data: {
          viewer: userFixture,
        },
      }),
    );

    const result = await fetchViewer();

    const [, init] = fetchMock.mock.calls[0];
    expect(init).toMatchObject({
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    const body = JSON.parse((init?.body ?? "") as string);
    expect(body.operationName).toBe("Viewer");
    expect(body.query).toContain("query Viewer");
    expect(body.locale).toBe(DEFAULT_LOCALE);

    expect(result).toEqual(userFixture);
  });

  it("allows overriding the locale when fetching the viewer", async () => {
    fetchMock.mockResolvedValue(
      mockJsonResponse({
        data: {
          viewer: userFixture,
        },
      }),
    );

    await fetchViewer({ locale: "es" });

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init?.body ?? "") as string);
    expect(body.locale).toBe("es");
  });

  it("surfaces GraphQL errors with status and details", async () => {
    fetchMock.mockResolvedValue(
      mockJsonResponse(
        {
          errors: [{ message: "Invalid credentials" }],
        },
        {
          ok: true,
          status: 200,
        },
      ),
    );

    expect.assertions(3);
    try {
      await signIn({ email: "person@example.com", password: "wrong" });
    } catch (error) {
      expect(error).toBeInstanceOf(AuthRequestError);
      expect((error as AuthRequestError).status).toBe(200);
      expect((error as AuthRequestError).details).toEqual([
        { message: "Invalid credentials" },
      ]);
    }
  });

  it("throws when JSON parsing fails", async () => {
    const jsonError = new SyntaxError("Unexpected token");

    fetchMock.mockResolvedValue(
      mockJsonResponse(null, {
        text: jest.fn().mockRejectedValue(jsonError),
      }),
    );

    await expect(
      signIn({ email: "person@example.com", password: "secret" }),
    ).rejects.toMatchObject({
      name: "AuthRequestError",
      status: 200,
      message: "Unable to read authentication response",
    });
  });
});
