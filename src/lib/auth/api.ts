import type {
  GraphQLRequestErrorOptions,
  GraphQLRequestSuccess,
} from "@/src/services/graphql/core";
import {
  GraphQLRequestError,
  createGraphQLService,
  normalizeUserErrors,
} from "@/src/services/graphql/core";

import type {
  AuthUser,
  SignInPayload,
  SignInResult,
  SignOutResult,
  SignUpPayload,
  SignUpResult,
  UserErrorPayload,
  ViewerResult,
} from "./types";

export class AuthRequestError extends GraphQLRequestError {
  constructor(message: string, options: GraphQLRequestErrorOptions = {}) {
    super(message, options);
    this.name = "AuthRequestError";
  }
}

async function executeAuthRequest<TData, TVariables = Record<string, unknown>>(
  payload: { body: { query: string; operationName?: string; variables?: TVariables } },
  options: { headers?: HeadersInit; locale?: string | null } = {},
): Promise<GraphQLRequestSuccess<TData>> {
  try {
    const service = createGraphQLService();
    return await service.execute<TData, TVariables>(payload.body, options);
  } catch (error) {
    if (error instanceof GraphQLRequestError) {
      throw new AuthRequestError(error.message, {
        status: error.status,
        details: error.details,
        topLevelErrors: error.topLevelErrors,
        cause: error.cause,
      });
    }

    throw error;
  }
}

interface SignInMutationResult {
  signIn?: {
    user?: AuthUser | null;
    userErrors?: UserErrorPayload[];
  } | null;
}

interface SignInMutationVariables {
  input: {
    credentials: {
      email: string;
      password: string;
    };
  };
}

const SIGN_IN_MUTATION = /* GraphQL */ `
  mutation SignIn($input: SignInInput!) {
    signIn(input: $input) {
      user {
        id
        email
        name
      }
      userErrors {
        message
        path
      }
    }
  }
`;

export async function signIn(
  payload: SignInPayload,
  options: { locale?: string | null } = {},
): Promise<SignInResult> {
  const { data, setCookies } = await executeAuthRequest<
    SignInMutationResult,
    SignInMutationVariables
  >(
    {
      body: {
        operationName: "SignIn",
        query: SIGN_IN_MUTATION,
        variables: {
          input: {
            credentials: {
              email: payload.email,
              password: payload.password,
            },
          },
        },
      },
    },
    options,
  );

  const result = data.signIn;

  if (!result) {
    throw new AuthRequestError("Authentication response did not include a sign-in payload");
  }

  const userErrors = normalizeUserErrors(result.userErrors);

  return {
    user: result.user ?? null,
    userErrors,
    setCookies,
  };
}

interface SignUpMutationResult {
  signUp?: {
    user?: AuthUser | null;
    userErrors?: UserErrorPayload[];
  } | null;
}

interface SignUpMutationVariables {
  input: {
    attributes: {
      email: string;
      name: string;
      password: string;
      passwordConfirmation: string;
    };
  };
}

const SIGN_UP_MUTATION = /* GraphQL */ `
  mutation SignUp($input: SignUpInput!) {
    signUp(input: $input) {
      user {
        id
        email
        name
      }
      userErrors {
        message
        path
      }
    }
  }
`;

export async function signUp(
  payload: SignUpPayload,
  options: { locale?: string | null } = {},
): Promise<SignUpResult> {
  const { data, setCookies } = await executeAuthRequest<
    SignUpMutationResult,
    SignUpMutationVariables
  >(
    {
      body: {
        operationName: "SignUp",
        query: SIGN_UP_MUTATION,
        variables: {
          input: {
            attributes: {
              email: payload.email,
              name: payload.name,
              password: payload.password,
              passwordConfirmation: payload.passwordConfirmation,
            },
          },
        },
      },
    },
    options,
  );

  const result = data.signUp;

  if (!result) {
    throw new AuthRequestError("Registration response did not include a sign-up payload");
  }

  const userErrors = normalizeUserErrors(result.userErrors);

  return {
    user: result.user ?? null,
    userErrors,
    setCookies,
  };
}

interface SignOutMutationResult {
  signOut?: {
    user?: AuthUser | null;
    userErrors?: UserErrorPayload[];
  } | null;
}

interface SignOutMutationVariables {
  input: Record<string, never>;
}

const SIGN_OUT_MUTATION = /* GraphQL */ `
  mutation SignOut($input: SignOutInput!) {
    signOut(input: $input) {
      user {
        id
        email
        name
      }
      userErrors {
        message
        path
      }
    }
  }
`;

export async function signOut(
  options: { headers?: HeadersInit; locale?: string | null } = {},
): Promise<SignOutResult> {
  const { data, setCookies } = await executeAuthRequest<
    SignOutMutationResult,
    SignOutMutationVariables
  >(
    {
      body: {
        operationName: "SignOut",
        query: SIGN_OUT_MUTATION,
        variables: {
          input: {},
        },
      },
    },
    options,
  );

  const result = data.signOut;

  if (!result) {
    throw new AuthRequestError("Sign-out response did not include a payload");
  }

  const userErrors = normalizeUserErrors(result.userErrors);

  return {
    user: result.user ?? null,
    userErrors,
    setCookies,
  };
}

const VIEWER_QUERY = /* GraphQL */ `
  query Viewer {
    viewer {
      id
      email
      name
    }
  }
`;

export async function fetchViewer({
  headers,
  locale,
}: { headers?: HeadersInit; locale?: string | null } = {}): Promise<AuthUser | null> {
  const { data } = await executeAuthRequest<ViewerResult>(
    {
      body: {
        operationName: "Viewer",
        query: VIEWER_QUERY,
      },
    },
    { headers, locale },
  );

  return data.viewer ?? null;
}
