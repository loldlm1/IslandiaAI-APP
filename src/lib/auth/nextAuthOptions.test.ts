import type { JWT } from "next-auth/jwt";

jest.mock("./api", () => {
  const actual = jest.requireActual("./api");
  return {
    ...actual,
    signIn: jest.fn(),
  };
});

import { authOptions } from "./nextAuthOptions";
import { signIn } from "./api";
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

  const validCredentials = {
    email: mockUser.email,
    password: "password123",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("authorizes a user with valid credentials", async () => {
    signInMock.mockResolvedValue({ user: mockUser, userErrors: [] });

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
      userErrors: [{ message: "Invalid credentials", path: ["credentials", "password"] }],
    });

    const authorize = getAuthorize();

    await expect(authorize(validCredentials)).rejects.toMatchObject({
      name: "AuthRequestError",
      message: "Invalid credentials",
      details: [{ message: "Invalid credentials", path: ["credentials", "password"] }],
    });
  });

  it("passes the locale from cookies to the sign-in mutation", async () => {
    signInMock.mockResolvedValue({ user: mockUser, userErrors: [] });

    const authorize = getAuthorize();
    await authorize(validCredentials, { headers: { cookie: "locale=es" } });

    expect(signInMock).toHaveBeenCalledWith(validCredentials, { locale: "es" });
  });

  it("throws when the API does not return a user", async () => {
    signInMock.mockResolvedValue({ user: null, userErrors: [] });

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
});
