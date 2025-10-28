import type { JWT } from "next-auth/jwt";

jest.mock("./api", () => {
  const actual = jest.requireActual("./api");
  return {
    ...actual,
    login: jest.fn(),
    fetchViewer: jest.fn(),
  };
});

import { authOptions } from "./nextAuthOptions";
import { AuthRequestError, fetchViewer, login } from "./api";
import {
  mockAccessToken,
  mockRefreshToken,
  mockUser,
} from "@/src/mocks/handlers/auth";
import { mockAuthTokens } from "@/tests/mocks/graphql";

type AuthorizeFn = (credentials?: Record<string, unknown>) => Promise<unknown>;

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

  const loginMock = login as jest.MockedFunction<typeof login>;
  const fetchViewerMock = fetchViewer as jest.MockedFunction<typeof fetchViewer>;

  const validCredentials = {
    email: mockUser.email,
    password: "password123",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("authorizes a user with valid credentials", async () => {
    loginMock.mockResolvedValue(mockAuthTokens);
    fetchViewerMock.mockResolvedValue(mockUser);

    const authorize = getAuthorize();
    const result = await authorize(validCredentials);

    expect(loginMock).toHaveBeenCalledWith(validCredentials);
    expect(fetchViewerMock).toHaveBeenCalledWith(mockAccessToken);
    expect(result).toEqual({
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
    });
  });

  it("requires both email and password", async () => {
    const authorize = getAuthorize();

    await expect(authorize(undefined)).rejects.toMatchObject({
      name: "AuthRequestError",
      message: "Email and password are required",
    });
    expect(loginMock).not.toHaveBeenCalled();
    expect(fetchViewerMock).not.toHaveBeenCalled();
  });

  it("rethrows AuthRequestError from downstream calls", async () => {
    const downstreamError = new AuthRequestError("Viewer is unavailable");

    loginMock.mockResolvedValue(mockAuthTokens);
    fetchViewerMock.mockRejectedValue(downstreamError);

    const authorize = getAuthorize();

    await expect(authorize(validCredentials)).rejects.toBe(downstreamError);
    expect(loginMock).toHaveBeenCalledTimes(1);
    expect(fetchViewerMock).toHaveBeenCalledTimes(1);
  });

  it("wraps unexpected errors with a generic AuthRequestError", async () => {
    const unexpectedError = new Error("Something went wrong");
    loginMock.mockRejectedValue(unexpectedError);

    const authorize = getAuthorize();

    await expect(authorize(validCredentials)).rejects.toMatchObject({
      name: "AuthRequestError",
      message: "Unable to complete sign in",
      cause: unexpectedError,
    });
    expect(fetchViewerMock).not.toHaveBeenCalled();
  });

  it("persists access and refresh tokens plus viewer data in the JWT callback", async () => {
    const jwtCallback = authOptions.callbacks?.jwt;
    expect(jwtCallback).toBeDefined();

    const baseToken: JWT = { sub: "user-sub" };
    const result = await jwtCallback!({
      token: baseToken,
      user: {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      },
      account: null,
      profile: null,
      trigger: "signIn",
    });

    expect(result).toMatchObject({
      sub: "user-sub",
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
      user: {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
      },
    });
  });

  it("exposes viewer data and tokens on the session", async () => {
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
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      },
      newSession: false,
      trigger: "update",
    });

    expect(result.user).toEqual({
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
    });
    expect(result.accessToken).toBe(mockAccessToken);
    expect(result.refreshToken).toBe(mockRefreshToken);
  });
});
