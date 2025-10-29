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
import { DEFAULT_LOCALE } from "@/src/lib/locale/constants";
import { normalizeLocale } from "@/src/lib/locale/utils";

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

interface GraphQLRequestOptions {
  headers?: HeadersInit;
  locale?: string | null;
}

interface GraphQLRequestResult<TData> {
  data: TData;
  setCookies: string[];
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


function splitSetCookieHeader(header: string): string[] {
  const cookies: string[] = [];
  let current = "";

  for (let index = 0; index < header.length; index += 1) {
    const character = header[index];

    if (character === ",") {
      const remainder = header.slice(index + 1);
      if (/^\s*[!#$%&'*+\-.^_`|~0-9A-Za-z]+=/.test(remainder)) {
        if (current.trim()) {
          cookies.push(current.trim());
        }
        current = "";
        continue;
      }
    }

    current += character;
  }

  if (current.trim()) {
    cookies.push(current.trim());
  }

  return cookies;
}

function extractSetCookies(response: Response): string[] {
  const headerStore = response.headers as unknown as {
    getSetCookie?: () => string[];
    raw?: () => Record<string, string[]>;
  };

  if (typeof headerStore.getSetCookie === "function") {
    return headerStore.getSetCookie();
  }

  const rawHeaders = headerStore.raw?.();

  if (rawHeaders) {
    const setCookie = rawHeaders["set-cookie"] ?? rawHeaders["Set-Cookie"];
    if (Array.isArray(setCookie)) {
      return setCookie;
    }
  }

  const header = response.headers.get("set-cookie");

  if (!header) {
    return [];
  }

  const parsed = splitSetCookieHeader(header);
  return parsed.length > 0 ? parsed : [header];
}

async function requestGraphQL<TData, TVariables = Record<string, unknown>>(
  body: GraphQLBody<TVariables>,
  { headers, locale }: GraphQLRequestOptions = {},
): Promise<GraphQLRequestResult<TData>> {
  const requestLocale = normalizeLocale(locale ?? DEFAULT_LOCALE);
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      ...JSON_HEADERS,
      ...headers,
    },
    body: JSON.stringify({
      ...body,
      locale: requestLocale,
    }),
    cache: "no-store",
    credentials: "include",
  });

  const json = (await parseJsonResponse<GraphQLResponse<TData>>(response)) ?? {};
  const setCookies = extractSetCookies(response);

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

  return { data: json.data, setCookies };
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

export async function signIn(
  payload: SignInPayload,
  options: { locale?: string | null } = {},
): Promise<SignInResult> {
  const { data, setCookies } = await requestGraphQL<
    SignInMutationResult,
    SignInMutationVariables
  >({
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
  }, options);

  const result = data.signIn;

  if (!result) {
    throw new AuthRequestError("Authentication response did not include a sign-in payload");
  }

  return {
    user: result.user ?? null,
    userErrors: result.userErrors ?? [],
    setCookies,
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

export async function signUp(
  payload: SignUpPayload,
  options: { locale?: string | null } = {},
): Promise<SignUpResult> {
  const { data, setCookies } = await requestGraphQL<
    SignUpMutationResult,
    SignUpMutationVariables
  >({
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
  }, options);

  const result = data.signUp;

  if (!result) {
    throw new AuthRequestError("Registration response did not include a sign-up payload");
  }

  return {
    user: result.user ?? null,
    userErrors: result.userErrors ?? [],
    setCookies,
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

export async function signOut(
  options: { headers?: HeadersInit; locale?: string | null } = {},
): Promise<SignOutResult> {
  const { data, setCookies } = await requestGraphQL<
    SignOutMutationResult,
    SignOutMutationVariables
  >({
    operationName: "SignOut",
    query: SIGN_OUT_MUTATION,
    variables: {
      input: {},
    },
  }, options);

  const result = data.signOut;

  if (!result) {
    throw new AuthRequestError("Sign-out response did not include a payload");
  }

  return {
    user: result.user ?? null,
    userErrors: result.userErrors ?? [],
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
  const { data } = await requestGraphQL<ViewerResult>(
    {
      operationName: "Viewer",
      query: VIEWER_QUERY,
    },
    { headers, locale },
  );

  return data.viewer ?? null;
}
