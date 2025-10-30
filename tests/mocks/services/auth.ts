import type { GraphQLService } from "@/src/services/graphql/core";
import {
  signInService,
  signOutService,
  signUpService,
  viewerService,
  type SignInServiceVariables,
  type SignOutServiceVariables,
  type SignUpServiceVariables,
  type ViewerServiceUser,
} from "@/src/services/graphql/auth";

import {
  buildAuthUser,
  buildErrorResponse,
  buildSignInErrors,
  buildSignInSuccess,
  buildSignOutSuccess,
  buildSignUpErrors,
  buildSignUpSuccess,
  buildUnauthorizedError,
  buildViewerSuccess,
  mockAuthUser,
  type AuthUser,
  type GraphQLSuccessEnvelope,
} from "@/tests/mocks/graphql";

export const SESSION_COOKIE_NAME = "islandia_session";
export const SESSION_COOKIE_VALUE = "mock-session";

export interface MockGraphQLResponse {
  body: unknown;
  init?: ResponseInit;
}

export interface AuthSessionContext {
  hasSessionCookie: boolean;
  sessionUser: ViewerServiceUser;
  setSessionUser(user: ViewerServiceUser): void;
  clearSessionUser(): void;
}

export interface AuthServiceRegistryEntry<TParsedVariables = void> {
  service: GraphQLService<unknown, unknown>;
  document: string;
  parseVariables: (variables: unknown) => TParsedVariables;
  respond: (options: {
    context: AuthSessionContext;
    variables: TParsedVariables;
  }) => MockGraphQLResponse;
}

function parseSignInVariables(variables: unknown) {
  const graphQLVariables = variables as
    | Partial<SignInServiceVariables>
    | null
    | undefined;
  const credentials = graphQLVariables?.input?.credentials ?? {};

  const email =
    typeof credentials.email === "string" && credentials.email.trim().length > 0
      ? credentials.email
      : mockAuthUser.email;
  const password =
    typeof credentials.password === "string" ? credentials.password : "";

  return { email, password };
}

function parseSignUpVariables(variables: unknown) {
  const graphQLVariables = variables as
    | Partial<SignUpServiceVariables>
    | null
    | undefined;
  const attributes = graphQLVariables?.input?.attributes ?? {};

  const email =
    typeof attributes.email === "string" && attributes.email.trim().length > 0
      ? attributes.email
      : "";
  const name =
    typeof attributes.name === "string" && attributes.name.trim().length > 0
      ? attributes.name
      : mockAuthUser.name;
  const password =
    typeof attributes.password === "string" ? attributes.password : "";
  const passwordConfirmation =
    typeof attributes.passwordConfirmation === "string"
      ? attributes.passwordConfirmation
      : "";

  return { email, name, password, passwordConfirmation };
}

function parseSignOutVariables(variables: unknown): SignOutServiceVariables {
  const graphQLVariables = variables as
    | Partial<SignOutServiceVariables>
    | null
    | undefined;

  if (graphQLVariables?.input && Object.keys(graphQLVariables.input).length > 0) {
    return { input: {} };
  }

  return { input: {} };
}

function parseViewerVariables() {
  return undefined;
}

export function respondWithSignIn(
  options: Parameters<AuthServiceRegistryEntry<{ email: string; password: string }>["respond"]>[0],
): MockGraphQLResponse {
  const {
    context,
    variables: { email, password },
  } = options;

  if (password !== "password123") {
    return {
      body: buildSignInErrors([
        { message: "Invalid credentials", path: ["credentials", "password"] },
      ]),
    };
  }

  context.setSessionUser(buildAuthUser({ email }));

  return {
    body: buildSignInSuccess({ email }),
    init: {
      headers: {
        "Set-Cookie": `${SESSION_COOKIE_NAME}=${SESSION_COOKIE_VALUE}; Path=/; HttpOnly`,
      },
    },
  };
}

export function respondWithSignUp(
  options: Parameters<
    AuthServiceRegistryEntry<{
      email: string;
      name: string;
      password: string;
      passwordConfirmation: string;
    }>["respond"]
  >[0],
): MockGraphQLResponse {
  const {
    context,
    variables: { email, name },
  } = options;

  if (email === "taken@example.com") {
    return {
      body: buildSignUpErrors([
        { message: "Email is already registered", path: ["attributes", "email"] },
      ]),
    };
  }

  context.setSessionUser(buildAuthUser({ id: "user_124", email, name }));

  return {
    body: buildSignUpSuccess({ email, name }),
    init: {
      headers: {
        "Set-Cookie": `${SESSION_COOKIE_NAME}=${SESSION_COOKIE_VALUE}; Path=/; HttpOnly`,
      },
    },
  };
}

export function respondWithSignOut(
  options: Parameters<AuthServiceRegistryEntry<SignOutServiceVariables>["respond"]>[0],
): MockGraphQLResponse {
  const { context } = options;

  context.clearSessionUser();

  return {
    body: buildSignOutSuccess(),
    init: {
      headers: {
        "Set-Cookie": `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly`,
      },
    },
  };
}

export function respondWithViewer(
  options: Parameters<AuthServiceRegistryEntry<void>["respond"]>[0],
): MockGraphQLResponse {
  const { context } = options;

  if (!context.hasSessionCookie) {
    return { body: buildUnauthorizedError() };
  }

  return { body: buildViewerSuccess(context.sessionUser) };
}

export const authServiceRegistry = {
  [signInService.operationName]: {
    service: signInService as GraphQLService<unknown, unknown>,
    document: signInService.document,
    parseVariables: parseSignInVariables,
    respond: respondWithSignIn,
  },
  [signUpService.operationName]: {
    service: signUpService as GraphQLService<unknown, unknown>,
    document: signUpService.document,
    parseVariables: parseSignUpVariables,
    respond: respondWithSignUp,
  },
  [signOutService.operationName]: {
    service: signOutService as GraphQLService<unknown, unknown>,
    document: signOutService.document,
    parseVariables: parseSignOutVariables,
    respond: respondWithSignOut,
  },
  [viewerService.operationName]: {
    service: viewerService as GraphQLService<unknown, unknown>,
    document: viewerService.document,
    parseVariables: parseViewerVariables,
    respond: respondWithViewer,
  },
} satisfies Record<string, AuthServiceRegistryEntry<unknown>>;

export type AuthServiceRegistry = typeof authServiceRegistry;

export function resolveAuthRegistryEntry(operationName: string) {
  return authServiceRegistry[operationName] as
    | AuthServiceRegistryEntry<unknown>
    | undefined;
}

export const AUTH_OPERATION_NAMES = {
  signIn: signInService.operationName,
  signUp: signUpService.operationName,
  signOut: signOutService.operationName,
  viewer: viewerService.operationName,
} as const;

export function getAuthServiceDocument(operationName: string): string {
  const entry = resolveAuthRegistryEntry(operationName);

  if (!entry) {
    throw new Error(`Missing auth service for operation "${operationName}".`);
  }

  return entry.document;
}

export function dispatchAuthOperation(
  operationName: string | undefined,
  variables: unknown,
  context: AuthSessionContext,
): MockGraphQLResponse | null {
  if (!operationName) {
    return null;
  }

  const entry = resolveAuthRegistryEntry(operationName);

  if (!entry) {
    return null;
  }

  const parsed = entry.parseVariables(variables);

  return entry.respond({ context, variables: parsed });
}

export function listAuthServiceEntries() {
  return Object.values(authServiceRegistry);
}

export {
  buildAuthUser,
  buildErrorResponse,
  buildSignInErrors,
  buildSignInSuccess,
  buildSignOutSuccess,
  buildSignUpErrors,
  buildSignUpSuccess,
  buildUnauthorizedError,
  buildViewerSuccess,
  mockAuthUser,
  type AuthUser,
  type GraphQLSuccessEnvelope,
};
