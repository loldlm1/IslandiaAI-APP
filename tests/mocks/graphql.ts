import type { AuthUser, UserErrorPayload } from "@/src/lib/auth/types";

export interface GraphQLErrorEnvelope {
  errors: { message: string }[];
}

const defaultAuthUser: AuthUser = {
  id: "user_123",
  email: "admin@example.com",
  name: "admin Innovator",
};

export const mockAuthUser: AuthUser = defaultAuthUser;

export function buildAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return { ...defaultAuthUser, ...overrides };
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

export function buildSignInSuccess(overrides: Partial<AuthUser> = {}) {
  return {
    data: {
      signIn: {
        user: buildAuthUser(overrides),
        userErrors: [],
      },
    },
  };
}

export function buildSignInErrors(userErrors: UserErrorPayload[]) {
  return {
    data: {
      signIn: {
        user: null,
        userErrors,
      },
    },
  };
}

export function buildSignUpSuccess(overrides: Partial<AuthUser> = {}) {
  return {
    data: {
      signUp: {
        user: buildAuthUser({ id: "user_124", ...overrides }),
        userErrors: [],
      },
    },
  };
}

export function buildSignUpErrors(userErrors: UserErrorPayload[]) {
  return {
    data: {
      signUp: {
        user: null,
        userErrors,
      },
    },
  };
}

export function buildSignOutSuccess() {
  return {
    data: {
      signOut: {
        user: null,
        userErrors: [],
      },
    },
  };
}

export function buildSignOutErrors(userErrors: UserErrorPayload[]) {
  return {
    data: {
      signOut: {
        user: null,
        userErrors,
      },
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
