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

async function requestGraphQL<TData, TVariables = Record<string, unknown>>(
  body: GraphQLBody<TVariables>,
  { accessToken }: { accessToken?: string } = {},
): Promise<TData> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  let json: GraphQLResponse<TData>;
  try {
    json = (await response.json()) as GraphQLResponse<TData>;
  } catch (error) {
    throw new AuthRequestError("Unable to parse authentication response", {
      status: response.status,
      cause: error,
    });
  }

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

const LOGIN_MUTATION = /* GraphQL */ `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        name
      }
    }
  }
`;

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const data = await requestGraphQL<{ login: AuthTokens & { user: AuthUser } }>(
    {
      operationName: "Login",
      query: LOGIN_MUTATION,
      variables: { input: payload },
    },
  );

  const { accessToken, refreshToken, user } = data.login;

  return {
    tokens: { accessToken, refreshToken },
    user,
  };
}

const REGISTER_MUTATION = /* GraphQL */ `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
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
  const data = await requestGraphQL<{ register: { user: AuthUser } }>(
    {
      operationName: "Register",
      query: REGISTER_MUTATION,
      variables: { input: payload },
    },
  );

  return {
    user: data.register.user,
  };
}

const LOGOUT_MUTATION = /* GraphQL */ `
  mutation Logout {
    logout {
      success
    }
  }
`;

export async function logout({ accessToken }: LogoutPayload = {}): Promise<LogoutResult> {
  const data = await requestGraphQL<{ logout: LogoutResult }>(
    {
      operationName: "Logout",
      query: LOGOUT_MUTATION,
    },
    { accessToken },
  );

  return data.logout;
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
