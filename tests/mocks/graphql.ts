import type {
  AuthTokens,
  AuthUser,
} from "@/src/lib/auth/types";

export interface GraphQLErrorEnvelope {
  errors: { message: string }[];
}

const defaultAuthUser: AuthUser = {
  id: "user_123",
  email: "isla@example.com",
  name: "Isla Innovator",
};

const defaultAuthTokens: AuthTokens = {
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
  tokenType: "Bearer",
  expiresIn: 7_200,
  createdAt: 1_701_610_002,
};

export const mockAuthUser: AuthUser = defaultAuthUser;
export const mockAuthTokens: AuthTokens = defaultAuthTokens;
export const mockAccessToken = mockAuthTokens.accessToken;
export const mockRefreshToken = mockAuthTokens.refreshToken ?? null;

interface LoginSuccessOverrides {
  tokens?: Partial<AuthTokens>;
}

export function buildAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return { ...defaultAuthUser, ...overrides };
}

export function buildAuthTokens(
  overrides: Partial<AuthTokens> = {},
): AuthTokens {
  return { ...defaultAuthTokens, ...overrides };
}

export function buildLoginSuccess(
  overrides: LoginSuccessOverrides = {},
) {
  const tokens = buildAuthTokens(overrides.tokens);

  return {
    data: {
      login: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? null,
        tokenType: tokens.tokenType,
        expiresIn: tokens.expiresIn,
        createdAt: tokens.createdAt,
      },
    },
  };
}

export function buildRegisterSuccess(overrides: Partial<AuthUser> = {}) {
  const baseUser = buildAuthUser({ id: "user_124" });

  return {
    data: {
      registerUser: {
        user: { ...baseUser, ...overrides },
      },
    },
  };
}

export function buildLogoutSuccess(success = true) {
  return {
    data: {
      logout: {
        success,
      },
    },
  };
}

export function buildAuthError(message: string) {
  return {
    errors: [{ message }],
  };
}

export function buildViewerSuccess(overrides: Partial<AuthUser> = {}) {
  return {
    data: {
      viewer: buildAuthUser(overrides),
    },
  };
}

export function buildErrorResponse(message: string): GraphQLErrorEnvelope {
  return {
    errors: [{ message }],
  };
}

export function buildUnauthorizedError(): GraphQLErrorEnvelope {
  return buildErrorResponse("Unauthorized");
}
