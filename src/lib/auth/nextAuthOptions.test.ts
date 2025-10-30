import type { JWT } from "next-auth/jwt";

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
  headers: jest.fn(),
}));

jest.mock("./api", () => {
  const actual = jest.requireActual("./api");
  return {
    ...actual,
    signIn: jest.fn(),
    signOut: jest.fn(),
  };
});

import { authOptions } from "./nextAuthOptions";
import { signIn, signOut } from "./api";
import {
  SIGN_OUT_ERROR_COOKIE_NAME,
  SIGN_OUT_ERROR_MAX_AGE_SECONDS,
} from "./constants";
import { mockUser } from "@/src/mocks/handlers/auth";
import { DEFAULT_LOCALE } from "@/src/lib/locale/constants";

type AuthorizeFn = (
  credentials?: Record<string, unknown>,
  req?: { headers?: Record<string, string | undefined> },
) => Promise<unknown>;

describe("nextAuthOptions", () => {
  const getAuthorize = (): AuthorizeFn => {
    const credentialsProvider = authOptions.providers.find((provider) => {
      return typeof (provider as { options?: { authorize?: AuthorizeFn } }).options
        ?.authorize === "function";
    }) as { options: { authorize: AuthorizeFn } } | undefined;

    if (!credentialsProvider) {
      throw new Error("Credentials provider is not configured");
    }

    return credentialsProvider.options.authorize;
  };

  const signInMock = signIn as jest.MockedFunction<typeof signIn>;
  const signOutMock = signOut as jest.MockedFunction<typeof signOut>;
  const { cookies: cookiesMock, headers: headersMock } = jest.requireMock("next/headers") as {
    cookies: jest.Mock;
    headers: jest.Mock;
  };
  const setCookieMock = jest.fn();
  const deleteCookieMock = jest.fn();

  const validCredentials = {
    email: mockUser.email,
    password: "password123",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setCookieMock.mockClear();
    deleteCookieMock.mockClear();
    cookiesMock.mockReturnValue({
      getAll: jest.fn(() => []),
      set: setCookieMock,
      delete: deleteCookieMock,
    });
    headersMock.mockReturnValue(new Headers());
  });

  it("authorizes a user with valid credentials", async () => {
    signInMock.mockResolvedValue({ user: mockUser, userErrors: [], setCookies: [] });

    const authorize = getAuthorize();
    const result = await authorize(validCredentials);

    expect(signInMock).toHaveBeenCalledWith(validCredentials, { locale: DEFAULT_LOCALE });
    expect(result).toEqual({
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
    });
  });

  it("requires both email and password", async () => {
    const authorize = getAuthorize();

    await expect(authorize(undefined)).rejects.toMatchObject({
      name: "AuthRequestError",
      message: "Email and password are required",
    });
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("throws when the API returns user errors", async () => {
    signInMock.mockResolvedValue({
      user: null,
      userErrors: [
        { message: "Invalid credentials", path: ["credentials", "password"], kind: "VALIDATION" },
      ],
      setCookies: [],
    });

    const authorize = getAuthorize();

    await expect(authorize(validCredentials)).rejects.toMatchObject({
      name: "AuthRequestError",
      message: "Invalid credentials",
      details: [{ message: "Invalid credentials", path: ["credentials", "password"] }],
    });
  });

  it("passes the locale from cookies to the sign-in mutation", async () => {
    signInMock.mockResolvedValue({ user: mockUser, userErrors: [], setCookies: [] });

    const authorize = getAuthorize();
    await authorize(validCredentials, { headers: { cookie: "locale=es" } });

    expect(signInMock).toHaveBeenCalledWith(validCredentials, { locale: "es" });
  });

  it("persists GraphQL authentication cookies when provided", async () => {
    signInMock.mockResolvedValue({
      user: mockUser,
      userErrors: [],
      setCookies: ["islandia_session=abc123; Path=/; HttpOnly; Secure; SameSite=Lax"],
    });

    const authorize = getAuthorize();
    await authorize(validCredentials);

    expect(setCookieMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "islandia_session",
        value: "abc123",
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      }),
    );
  });

  it("drops mismatched cookie domains so cookies apply to the request host", async () => {
    headersMock.mockReturnValue(new Headers({ host: "localhost:43111" }));
    signInMock.mockResolvedValue({
      user: mockUser,
      userErrors: [],
      setCookies: ["islandia_session=abc123; Path=/; Domain=127.0.0.1; HttpOnly"],
    });

    const authorize = getAuthorize();
    await authorize(validCredentials);

    expect(setCookieMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "islandia_session",
        domain: undefined,
      }),
    );
  });

  it("preserves compatible cookie domains when they match the request host", async () => {
    headersMock.mockReturnValue(new Headers({ host: "app.localhost:43111" }));
    signInMock.mockResolvedValue({
      user: mockUser,
      userErrors: [],
      setCookies: ["islandia_session=abc123; Path=/; Domain=.localhost; HttpOnly"],
    });

    const authorize = getAuthorize();
    await authorize(validCredentials);

    expect(setCookieMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "islandia_session",
        domain: ".localhost",
      }),
    );
  });

  it("throws when the API does not return a user", async () => {
    signInMock.mockResolvedValue({ user: null, userErrors: [], setCookies: [] });

    const authorize = getAuthorize();

    await expect(authorize(validCredentials)).rejects.toMatchObject({
      name: "AuthRequestError",
      message: "Authentication response did not include a user",
    });
  });

  it("wraps unexpected errors with a generic AuthRequestError", async () => {
    const unexpectedError = new Error("Something went wrong");
    signInMock.mockRejectedValue(unexpectedError);

    const authorize = getAuthorize();

    await expect(authorize(validCredentials)).rejects.toMatchObject({
      name: "AuthRequestError",
      message: "Unable to complete sign in",
      cause: unexpectedError,
    });
  });

  it("persists user details in the JWT callback", async () => {
    const jwtCallback = authOptions.callbacks?.jwt;
    expect(jwtCallback).toBeDefined();

    const baseToken: JWT = { sub: "user-sub" };
    const result = await jwtCallback!({
      token: baseToken,
      user: {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
      },
      account: null,
      profile: null,
      trigger: "signIn",
    });

    expect(result).toMatchObject({
      sub: "user-sub",
      user: {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
      },
    });
  });

  it("merges user data from the JWT into the session", async () => {
    const sessionCallback = authOptions.callbacks?.session;
    expect(sessionCallback).toBeDefined();

    const result = await sessionCallback!({
      session: {
        user: {
          name: "Existing Name",
        },
      },
      token: {
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
        },
      },
      newSession: false,
      trigger: "update",
    });

    expect(result.user).toEqual({
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
    });
  });

  it("revokes the GraphQL session cookie during sign-out events", async () => {
    const signOutEvent = authOptions.events?.signOut;
    expect(signOutEvent).toBeDefined();

    headersMock.mockReturnValueOnce(new Headers({ cookie: "locale=es; islandia_session=xyz" }));
    signOutMock.mockResolvedValue({
      user: null,
      userErrors: [],
      setCookies: ["islandia_session=; Path=/; Max-Age=0; HttpOnly"],
    });

    await signOutEvent?.();

    expect(signOutMock).toHaveBeenCalledWith({
      headers: { cookie: "locale=es; islandia_session=xyz" },
      locale: "es",
    });
    expect(setCookieMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: SIGN_OUT_ERROR_COOKIE_NAME,
        maxAge: 0,
      }),
    );
    expect(setCookieMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "islandia_session",
        maxAge: 0,
        httpOnly: true,
      }),
    );
  });

  it("records sign-out user errors without interrupting the flow", async () => {
    const signOutEvent = authOptions.events?.signOut;
    expect(signOutEvent).toBeDefined();

    headersMock.mockReturnValueOnce(new Headers({ cookie: "islandia_session=xyz" }));
    signOutMock.mockResolvedValue({
      user: null,
      userErrors: [{ message: "Session could not be closed", path: [], kind: "VALIDATION" }],
      setCookies: [],
    });

    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    await signOutEvent?.();

    expect(warnSpy).toHaveBeenCalledWith("GraphQL sign-out returned user errors", [
      { message: "Session could not be closed", path: [], kind: "VALIDATION" },
    ]);
    expect(setCookieMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: SIGN_OUT_ERROR_COOKIE_NAME,
        maxAge: SIGN_OUT_ERROR_MAX_AGE_SECONDS,
        httpOnly: false,
      }),
    );
    warnSpy.mockRestore();
  });

  it("captures unexpected sign-out errors without throwing", async () => {
    const signOutEvent = authOptions.events?.signOut;
    expect(signOutEvent).toBeDefined();

    headersMock.mockReturnValueOnce(new Headers({ cookie: "islandia_session=xyz" }));
    const error = new Error("Network unavailable");
    signOutMock.mockRejectedValue(error);

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await signOutEvent?.();

    expect(errorSpy).toHaveBeenCalledWith("Failed to clear authentication cookies", error);
    expect(setCookieMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: SIGN_OUT_ERROR_COOKIE_NAME,
        maxAge: SIGN_OUT_ERROR_MAX_AGE_SECONDS,
        httpOnly: false,
      }),
    );
    errorSpy.mockRestore();
  });
});
