import {
  type AuthTokens,
  type AuthUser,
  type GraphQLErrorResponse,
  type LoginPayload,
  type LoginResult,
  type LogoutPayload,
  type LogoutResult,
  type RegisterPayload,
  type RegisterResult,
  type ViewerResult,
} from "./types";

const DEFAULT_GRAPHQL_ENDPOINT = "http://localhost:4000/graphql";

export const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? DEFAULT_GRAPHQL_ENDPOINT;

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

interface GraphQLBody<TVariables> {
  query: string;
  variables?: TVariables;
  operationName?: string;
}

interface GraphQLResponse<TData> {
  data?: TData;
  errors?: GraphQLErrorResponse[];
}

export class AuthRequestError extends Error {
  public readonly status?: number;
  public readonly details?: GraphQLErrorResponse[];

  constructor(
    message: string,
    options?: { status?: number; details?: GraphQLErrorResponse[]; cause?: unknown },
  ) {
    super(message);
    this.name = "AuthRequestError";
    this.status = options?.status;
    this.details = options?.details;
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  let text: string;

  try {
    text = await response.text();
  } catch (error) {
    throw new AuthRequestError("Unable to read authentication response", {
      status: response.status,
      cause: error,
    });
  }

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new AuthRequestError("Unable to parse authentication response", {
      status: response.status,
      cause: error,
    });
  }
}


async function requestGraphQL<TData, TVariables = Record<string, unknown>>(
  body: GraphQLBody<TVariables>,
  { accessToken }: { accessToken?: string } = {},
): Promise<TData> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      ...JSON_HEADERS,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const json = (await parseJsonResponse<GraphQLResponse<TData>>(response)) ?? {};

  if (!response.ok) {
    throw new AuthRequestError("Authentication request failed", {
      status: response.status,
      details: json.errors,
    });
  }

  if (json.errors?.length) {
    throw new AuthRequestError(json.errors[0]?.message ?? "Unexpected error", {
      status: response.status,
      details: json.errors,
    });
  }

  if (!json.data) {
    throw new AuthRequestError("Authentication response did not include data", {
      status: response.status,
    });
  }

  return json.data;
}

interface LoginMutationResult {
  login?: {
    accessToken?: string;
    refreshToken?: string | null;
    tokenType?: string;
    expiresIn?: number;
    createdAt?: number;
  } | null;
}

interface LoginMutationVariables {
  input: {
    email: string;
    password: string;
  };
}

const LOGIN_MUTATION = /* GraphQL */ `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      tokenType
      expiresIn
      createdAt
    }
  }
`;

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const data = await requestGraphQL<LoginMutationResult, LoginMutationVariables>({
    operationName: "Login",
    query: LOGIN_MUTATION,
    variables: {
      input: {
        email: payload.email,
        password: payload.password,
      },
    },
  });

  const tokens = data.login;

  if (!tokens || typeof tokens.accessToken !== "string") {
    throw new AuthRequestError("Authentication response did not include an access token");
  }

  if (typeof tokens.tokenType !== "string") {
    throw new AuthRequestError("Authentication response did not include the token type");
  }

  if (typeof tokens.expiresIn !== "number") {
    throw new AuthRequestError(
      "Authentication response did not include the token expiration",
    );
  }

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? null,
    tokenType: tokens.tokenType,
    expiresIn: tokens.expiresIn,
    createdAt: tokens.createdAt,
  };
}

interface RegisterMutationResult {
  registerUser?: {
    user?: AuthUser | null;
  } | null;
}

interface RegisterMutationVariables {
  input: {
    email: string;
    name: string;
    password: string;
    organizationName?: string;
  };
}

const REGISTER_MUTATION = /* GraphQL */ `
  mutation RegisterUser($input: RegisterUserInput!) {
    registerUser(input: $input) {
      user {
        id
        email
        name
      }
    }
  }
`;

export async function register(
  payload: RegisterPayload,
): Promise<RegisterResult> {
  const data = await requestGraphQL<RegisterMutationResult, RegisterMutationVariables>({
    operationName: "RegisterUser",
    query: REGISTER_MUTATION,
    variables: {
      input: {
        email: payload.email,
        name: payload.name,
        password: payload.password,
        ...(payload.organizationName
          ? { organizationName: payload.organizationName }
          : {}),
      },
    },
  });

  const user = data.registerUser?.user;

  if (
    !user ||
    typeof user.id !== "string" ||
    typeof user.email !== "string" ||
    typeof user.name !== "string"
  ) {
    throw new AuthRequestError("Registration response did not include a user");
  }

  return { user };
}

interface LogoutMutationResult {
  logout?: {
    success?: boolean | null;
  } | null;
}

interface LogoutMutationVariables {
  input?: {
    token?: string | null;
  };
}

const LOGOUT_MUTATION = /* GraphQL */ `
  mutation Logout($input: LogoutInput!) {
    logout(input: $input) {
      success
    }
  }
`;

export async function logout({ accessToken }: LogoutPayload = {}): Promise<LogoutResult> {
  const data = await requestGraphQL<LogoutMutationResult, LogoutMutationVariables>(
    {
      operationName: "Logout",
      query: LOGOUT_MUTATION,
      variables: {
        input: {
          token: accessToken ?? null,
        },
      },
    },
    { accessToken },
  );

  const success = data.logout?.success;

  return { success: success ?? true };
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

export async function fetchViewer(accessToken: string): Promise<AuthUser> {
  const data = await requestGraphQL<ViewerResult>(
    {
      operationName: "Viewer",
      query: VIEWER_QUERY,
    },
    { accessToken },
  );

  return data.viewer;
}
