import {
  type AuthUser,
  type GraphQLErrorResponse,
  type SignInPayload,
  type SignInResult,
  type SignOutResult,
  type SignUpPayload,
  type SignUpResult,
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
  { headers }: { headers?: HeadersInit } = {},
): Promise<TData> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      ...JSON_HEADERS,
      ...headers,
    },
    body: JSON.stringify(body),
    cache: "no-store",
    credentials: "include",
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

interface SignInMutationResult {
  signIn?: {
    user?: AuthUser | null;
    userErrors?: { message: string; path: string[] }[];
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

export async function signIn(payload: SignInPayload): Promise<SignInResult> {
  const data = await requestGraphQL<SignInMutationResult, SignInMutationVariables>({
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
  });

  const result = data.signIn;

  if (!result) {
    throw new AuthRequestError("Authentication response did not include a sign-in payload");
  }

  return {
    user: result.user ?? null,
    userErrors: result.userErrors ?? [],
  };
}

interface SignUpMutationResult {
  signUp?: {
    user?: AuthUser | null;
    userErrors?: { message: string; path: string[] }[];
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

export async function signUp(payload: SignUpPayload): Promise<SignUpResult> {
  const data = await requestGraphQL<SignUpMutationResult, SignUpMutationVariables>({
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
  });

  const result = data.signUp;

  if (!result) {
    throw new AuthRequestError("Registration response did not include a sign-up payload");
  }

  return {
    user: result.user ?? null,
    userErrors: result.userErrors ?? [],
  };
}

interface SignOutMutationResult {
  signOut?: {
    user?: AuthUser | null;
    userErrors?: { message: string; path: string[] }[];
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

export async function signOut(): Promise<SignOutResult> {
  const data = await requestGraphQL<SignOutMutationResult, SignOutMutationVariables>({
    operationName: "SignOut",
    query: SIGN_OUT_MUTATION,
    variables: {
      input: {},
    },
  });

  const result = data.signOut;

  if (!result) {
    throw new AuthRequestError("Sign-out response did not include a payload");
  }

  return {
    user: result.user ?? null,
    userErrors: result.userErrors ?? [],
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
}: { headers?: HeadersInit } = {}): Promise<AuthUser | null> {
  const data = await requestGraphQL<ViewerResult>(
    {
      operationName: "Viewer",
      query: VIEWER_QUERY,
    },
    { headers },
  );

  return data.viewer ?? null;
}
