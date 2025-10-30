import type {
  GraphQLRequestErrorOptions,
  GraphQLRequestSuccess,
  GraphQLService,
} from "@/src/services/graphql/core";
import {
  GraphQLRequestError,
  executeGraphQLService,
  normalizeUserErrors,
} from "@/src/services/graphql/core";
import {
  signInService,
  signOutService,
  signUpService,
  viewerService,
  type SignInServiceData,
  type SignInServiceInput,
  type SignInServiceVariables,
  type SignUpServiceData,
  type SignUpServiceInput,
  type SignUpServiceVariables,
  type SignOutServiceData,
  type SignOutServiceInput,
  type SignOutServiceVariables,
  type ViewerServiceData,
  type ViewerServiceInput,
} from "@/src/services/graphql/auth";

import type {
  AuthUser,
  SignInPayload,
  SignInResult,
  SignOutResult,
  SignUpPayload,
  SignUpResult,
} from "./types";

type AuthRequestOptions = { headers?: HeadersInit; locale?: string | null };

export class AuthRequestError extends GraphQLRequestError {
  constructor(message: string, options: GraphQLRequestErrorOptions = {}) {
    super(message, options);
    this.name = "AuthRequestError";
  }
}

async function executeAuthService<TInput, TData, TVariables>(
  service: GraphQLService<TInput, TVariables>,
  input: TInput,
  options: AuthRequestOptions = {},
): Promise<GraphQLRequestSuccess<TData>> {
  try {
    return await executeGraphQLService<TData, TVariables, TInput>(service, input, options);
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

export async function signIn(
  payload: SignInPayload,
  options: { locale?: string | null } = {},
): Promise<SignInResult> {
  const { data, setCookies } = await executeAuthService<
    SignInServiceInput,
    SignInServiceData,
    SignInServiceVariables
  >(signInService, payload, options);

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

export async function signUp(
  payload: SignUpPayload,
  options: { locale?: string | null } = {},
): Promise<SignUpResult> {
  const { data, setCookies } = await executeAuthService<
    SignUpServiceInput,
    SignUpServiceData,
    SignUpServiceVariables
  >(signUpService, payload, options);

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

export async function signOut(
  options: { headers?: HeadersInit; locale?: string | null } = {},
): Promise<SignOutResult> {
  const { data, setCookies } = await executeAuthService<
    SignOutServiceInput,
    SignOutServiceData,
    SignOutServiceVariables
  >(signOutService, undefined, options);

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

export async function fetchViewer({
  headers,
  locale,
}: { headers?: HeadersInit; locale?: string | null } = {}): Promise<AuthUser | null> {
  const { data } = await executeAuthService<ViewerServiceInput, ViewerServiceData, undefined>(
    viewerService,
    undefined,
    { headers, locale },
  );

  return data.viewer ?? null;
}
