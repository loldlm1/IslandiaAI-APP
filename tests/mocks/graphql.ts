import type {
  SignInServiceData,
  SignInServiceUser,
  SignInServiceUserError,
  SignOutServiceData,
  SignOutServiceUser,
  SignOutServiceUserError,
  SignUpServiceData,
  SignUpServiceUser,
  SignUpServiceUserError,
  ViewerServiceData,
  ViewerServiceUser,
} from "@/src/services/graphql/auth";

export type AuthUser = SignInServiceUser;
export type UserErrorPayload =
  | SignInServiceUserError
  | SignUpServiceUserError
  | SignOutServiceUserError;

export interface GraphQLSuccessEnvelope<TData> {
  data: TData;
}

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

export function buildViewerSuccess(
  overrides: Partial<ViewerServiceUser> = {},
): GraphQLSuccessEnvelope<ViewerServiceData> {
  return {
    data: {
      viewer: buildAuthUser(overrides),
    },
  };
}

export function buildSignInSuccess(
  overrides: Partial<SignInServiceUser> = {},
): GraphQLSuccessEnvelope<SignInServiceData> {
  return {
    data: {
      signIn: {
        user: buildAuthUser(overrides),
        userErrors: [],
      },
    },
  };
}

export function buildSignInErrors(
  userErrors: SignInServiceUserError[],
): GraphQLSuccessEnvelope<SignInServiceData> {
  return {
    data: {
      signIn: {
        user: null,
        userErrors,
      },
    },
  };
}

export function buildSignUpSuccess(
  overrides: Partial<SignUpServiceUser> = {},
): GraphQLSuccessEnvelope<SignUpServiceData> {
  return {
    data: {
      signUp: {
        user: buildAuthUser({ id: "user_124", ...overrides }),
        userErrors: [],
      },
    },
  };
}

export function buildSignUpErrors(
  userErrors: SignUpServiceUserError[],
): GraphQLSuccessEnvelope<SignUpServiceData> {
  return {
    data: {
      signUp: {
        user: null,
        userErrors,
      },
    },
  };
}

export function buildSignOutSuccess(): GraphQLSuccessEnvelope<SignOutServiceData> {
  return {
    data: {
      signOut: {
        user: null,
        userErrors: [],
      },
    },
  };
}

export function buildSignOutErrors(
  userErrors: SignOutServiceUserError[],
): GraphQLSuccessEnvelope<SignOutServiceData> {
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
