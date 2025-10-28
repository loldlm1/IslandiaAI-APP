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
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken ?? null,
    token_type: tokens.tokenType,
    expires_in: tokens.expiresIn,
    created_at: tokens.createdAt,
    scope: "public",
  };
}

export function buildRegisterSuccess(overrides: Partial<AuthUser> = {}) {
  const baseUser = buildAuthUser({ id: "user_124" });

  return {
    user: { ...baseUser, ...overrides },
  };
}

export function buildLogoutSuccess(success = true) {
  return {
    success,
  };
}

export function buildAuthError(message: string) {
  return {
    error: "invalid_request",
    error_description: message,
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
