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

function resolveBackendUrl(pathname: string): string {
  try {
    return new URL(pathname, GRAPHQL_ENDPOINT).toString();
  } catch {
    return new URL(pathname, DEFAULT_GRAPHQL_ENDPOINT).toString();
  }
}

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

function normalizeErrorDetails(body: unknown): GraphQLErrorResponse[] | undefined {
  if (!body) {
    return undefined;
  }

  if (typeof body === "string") {
    return [{ message: body }];
  }

  if (Array.isArray(body)) {
    return body
      .map((entry) => {
        if (typeof entry === "string") {
          return entry;
        }

        if (entry && typeof entry === "object" && "message" in entry) {
          return String((entry as { message?: unknown }).message ?? "");
        }

        return JSON.stringify(entry);
      })
      .filter((message) => message.length > 0)
      .map((message) => ({ message }));
  }

  if (typeof body === "object") {
    const messages = new Set<string>();
    const record = body as Record<string, unknown>;

    const addMessage = (value: unknown) => {
      if (typeof value === "string" && value.trim()) {
        messages.add(value);
      }
    };

    addMessage(record.error_description);
    addMessage(record.error);
    addMessage(record.message);

    if (Array.isArray(record.errors)) {
      record.errors.forEach((value) => {
        if (typeof value === "string") {
          messages.add(value);
        } else if (value && typeof value === "object" && "message" in value) {
          addMessage((value as { message?: unknown }).message);
        } else {
          messages.add(JSON.stringify(value));
        }
      });
    } else if (record.errors && typeof record.errors === "object") {
      Object.entries(record.errors as Record<string, unknown>).forEach(
        ([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((entry) => {
              if (typeof entry === "string" && entry.trim()) {
                messages.add(`${key} ${entry}`.trim());
              } else if (entry) {
                messages.add(`${key} ${JSON.stringify(entry)}`.trim());
              }
            });
          } else if (typeof value === "string") {
            messages.add(`${key} ${value}`.trim());
          }
        },
      );
    }

    if (messages.size) {
      return Array.from(messages).map((message) => ({ message }));
    }
  }

  return undefined;
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

interface OAuthTokenResponse {
  access_token?: string;
  refresh_token?: string | null;
  token_type?: string;
  expires_in?: number;
  created_at?: number;
  scope?: string;
}

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const response = await fetch(resolveBackendUrl("/oauth/token"), {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({
      grant_type: "password",
      username: payload.email,
      email: payload.email,
      password: payload.password,
    }),
    cache: "no-store",
  });

  const body = await parseJsonResponse<OAuthTokenResponse | Record<string, unknown>>(
    response,
  );

  if (!response.ok) {
    const details = normalizeErrorDetails(body ?? undefined);
    throw new AuthRequestError(
      details?.[0]?.message ?? "Authentication request failed",
      {
        status: response.status,
        details,
      },
    );
  }

  if (!body || typeof body !== "object") {
    throw new AuthRequestError("Authentication response did not include data", {
      status: response.status,
    });
  }

  const tokenBody = body as OAuthTokenResponse;

  if (typeof tokenBody.access_token !== "string") {
    throw new AuthRequestError(
      "Authentication response did not include an access token",
      { status: response.status },
    );
  }

  if (typeof tokenBody.token_type !== "string") {
    throw new AuthRequestError(
      "Authentication response did not include the token type",
      { status: response.status },
    );
  }

  if (typeof tokenBody.expires_in !== "number") {
    throw new AuthRequestError(
      "Authentication response did not include the token expiration",
      { status: response.status },
    );
  }

  return {
    accessToken: tokenBody.access_token,
    refreshToken: tokenBody.refresh_token ?? null,
    tokenType: tokenBody.token_type,
    expiresIn: tokenBody.expires_in,
    createdAt: tokenBody.created_at,
  };
}

interface RegisterSuccessResponse {
  user?: AuthUser;
  id?: string;
  email?: string;
  name?: string;
}

export async function register(
  payload: RegisterPayload,
): Promise<RegisterResult> {
  const response = await fetch(resolveBackendUrl("/users"), {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({
      user: {
        email: payload.email,
        name: payload.name,
        password: payload.password,
        ...(payload.organizationName
          ? { organization_name: payload.organizationName }
          : {}),
      },
    }),
    cache: "no-store",
  });

  const body = await parseJsonResponse<RegisterSuccessResponse | Record<string, unknown>>(
    response,
  );

  if (!response.ok) {
    const details = normalizeErrorDetails(body ?? undefined);
    throw new AuthRequestError(
      details?.[0]?.message ?? "Registration request failed",
      {
        status: response.status,
        details,
      },
    );
  }

  if (!body || typeof body !== "object") {
    throw new AuthRequestError("Registration response did not include data", {
      status: response.status,
    });
  }

  const registerBody = body as RegisterSuccessResponse;
  const user = registerBody.user ?? registerBody;

  if (
    !user ||
    typeof user.id !== "string" ||
    typeof user.email !== "string" ||
    typeof user.name !== "string"
  ) {
    throw new AuthRequestError("Registration response did not include a user", {
      status: response.status,
    });
  }

  return { user };
}

interface LogoutResponseBody {
  success?: boolean;
}

export async function logout({ accessToken }: LogoutPayload = {}): Promise<LogoutResult> {
  const response = await fetch(resolveBackendUrl("/oauth/revoke"), {
    method: "POST",
    headers: {
      ...JSON_HEADERS,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ token: accessToken ?? null }),
    cache: "no-store",
  });

  const body = await parseJsonResponse<LogoutResponseBody | Record<string, unknown>>(
    response,
  );

  if (!response.ok) {
    const details = normalizeErrorDetails(body ?? undefined);
    throw new AuthRequestError(details?.[0]?.message ?? "Logout request failed", {
      status: response.status,
      details,
    });
  }

  if (!body) {
    return { success: true };
  }

  if (typeof body === "object" && "success" in body) {
    return { success: Boolean((body as LogoutResponseBody).success) };
  }

  return { success: true };
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
