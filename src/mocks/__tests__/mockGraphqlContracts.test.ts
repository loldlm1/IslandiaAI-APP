import { NextRequest } from "next/server";

import { POST as graphqlRoute } from "@/app/api/mock/graphql/route";
import type { RequestHandler } from "msw";

import { handlers } from "@/src/mocks/handlers";
import {
  AUTH_OPERATION_NAMES,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_VALUE,
  buildSignInErrors,
  buildSignInSuccess,
  buildSignOutSuccess,
  buildSignUpErrors,
  buildSignUpSuccess,
  buildUnauthorizedError,
  buildViewerSuccess,
  listAuthServiceEntries,
} from "@/tests/mocks/services/auth";

const GRAPHQL_ENDPOINT = "http://mock.api/graphql";
const AUTH_DOCUMENTS = new Map(
  listAuthServiceEntries().map((entry) => [entry.service.operationName, entry.document]),
);

function getAuthDocument(operationName: string): string {
  const document = AUTH_DOCUMENTS.get(operationName);

  if (!document) {
    throw new Error(`Missing GraphQL document for operation "${operationName}".`);
  }

  return document;
}

if (typeof (Response as typeof globalThis.Response & { json?: typeof Response.json }).json !== "function") {
  (Response as typeof globalThis.Response & { json?: typeof Response.json }).json = (
    body: unknown,
    init?: ResponseInit,
  ) => {
    const headers = new Headers(init?.headers);

    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    return new Response(JSON.stringify(body), {
      ...init,
      headers,
    });
  };
}

type GraphQLHandler = RequestHandler & {
  info: RequestHandler["info"] & { operationName?: string | RegExp };
};

function findGraphQLHandler(operationName: string): GraphQLHandler {
  const handler = handlers.find(
    (candidate): candidate is GraphQLHandler =>
      "info" in candidate && candidate.info.operationName === operationName,
  );

  if (!handler) {
    throw new Error(`Handler for operation "${operationName}" was not found.`);
  }

  return handler;
}


async function executeGraphQLHandler(
  operationName: string,
  body: Record<string, unknown> = {},
  headers: HeadersInit = {},
) {
  const handler = findGraphQLHandler(operationName);
  const query = getAuthDocument(operationName);

  const request = new Request(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      operationName,
      query,
      ...body,
    }),
  });

  const executionResult = await handler.run({
    request,
    requestId: `${operationName}-test`,
  });

  if (!executionResult?.response) {
    throw new Error(`Handler for operation "${operationName}" did not return a response.`);
  }

  return executionResult.response.json();
}

function createNextRequest(body: unknown, headers: HeadersInit = {}) {
  const requestLike = {
    json: async () => body,
    headers: new Headers(headers),
  };

  return requestLike as unknown as NextRequest;
}

describe("mock backend contract parity", () => {
  describe("MSW handlers", () => {
    it("returns the sign-in success payload", async () => {
      const result = await executeGraphQLHandler(AUTH_OPERATION_NAMES.signIn, {
        variables: {
          input: {
            credentials: {
              email: "user@example.com",
              password: "password123",
            },
          },
        },
      });

      expect(result).toEqual(
        buildSignInSuccess({
          email: "user@example.com",
        }),
      );
    });

    it("returns the sign-in error payload", async () => {
      const result = await executeGraphQLHandler(AUTH_OPERATION_NAMES.signIn, {
        variables: {
          input: {
            credentials: {
              email: "user@example.com",
              password: "wrong",
            },
          },
        },
      });

      expect(result).toEqual(
        buildSignInErrors([
          { message: "Invalid credentials", path: ["credentials", "password"] },
        ]),
      );
    });

    it("returns the sign-up success payload", async () => {
      const result = await executeGraphQLHandler(AUTH_OPERATION_NAMES.signUp, {
        variables: {
          input: {
            attributes: {
              email: "new@example.com",
              name: "New User",
              password: "password123",
              passwordConfirmation: "password123",
            },
          },
        },
      });

      expect(result).toEqual(
        buildSignUpSuccess({
          email: "new@example.com",
          name: "New User",
        }),
      );
    });

    it("returns the sign-up error payload", async () => {
      const result = await executeGraphQLHandler(AUTH_OPERATION_NAMES.signUp, {
        variables: {
          input: {
            attributes: {
              email: "taken@example.com",
              name: "Existing User",
              password: "password123",
              passwordConfirmation: "password123",
            },
          },
        },
      });

      expect(result).toEqual(
        buildSignUpErrors([
          { message: "Email is already registered", path: ["attributes", "email"] },
        ]),
      );
    });

    it("returns the sign-out success payload", async () => {
      const result = await executeGraphQLHandler(AUTH_OPERATION_NAMES.signOut, {
        variables: {
          input: {},
        },
      });

      expect(result).toEqual(buildSignOutSuccess());
    });

    it("returns the viewer success payload", async () => {
      const result = await executeGraphQLHandler(
        AUTH_OPERATION_NAMES.viewer,
        {},
        {
          cookie: `${SESSION_COOKIE_NAME}=${SESSION_COOKIE_VALUE}`,
        },
      );

      expect(result).toEqual(buildViewerSuccess());
    });

    it("returns the viewer unauthorized envelope", async () => {
      const result = await executeGraphQLHandler(AUTH_OPERATION_NAMES.viewer);

      expect(result).toEqual(buildUnauthorizedError());
    });
  });

  describe("Next.js route", () => {
    it("returns the sign-in success payload", async () => {
      const payload = {
        operationName: AUTH_OPERATION_NAMES.signIn,
        query: getAuthDocument(AUTH_OPERATION_NAMES.signIn),
        variables: {
          input: {
            credentials: {
              email: "user@example.com",
              password: "password123",
            },
          },
        },
      };

      const response = await graphqlRoute(createNextRequest(payload));
      const result = await response.json();

      expect(result).toEqual(
        buildSignInSuccess({
          email: "user@example.com",
        }),
      );
      expect(response.headers.get("set-cookie")).toContain(
        `${SESSION_COOKIE_NAME}=${SESSION_COOKIE_VALUE}`,
      );
    });

    it("returns the sign-in error payload", async () => {
      const payload = {
        operationName: AUTH_OPERATION_NAMES.signIn,
        query: getAuthDocument(AUTH_OPERATION_NAMES.signIn),
        variables: {
          input: {
            credentials: {
              email: "user@example.com",
              password: "wrong",
            },
          },
        },
      };

      const response = await graphqlRoute(createNextRequest(payload));
      const result = await response.json();

      expect(result).toEqual(
        buildSignInErrors([
          { message: "Invalid credentials", path: ["credentials", "password"] },
        ]),
      );
    });

    it("returns the sign-up success payload", async () => {
      const payload = {
        operationName: AUTH_OPERATION_NAMES.signUp,
        query: getAuthDocument(AUTH_OPERATION_NAMES.signUp),
        variables: {
          input: {
            attributes: {
              email: "new@example.com",
              name: "New User",
              password: "password123",
              passwordConfirmation: "password123",
            },
          },
        },
      };

      const response = await graphqlRoute(createNextRequest(payload));
      const result = await response.json();

      expect(result).toEqual(
        buildSignUpSuccess({
          email: "new@example.com",
          name: "New User",
        }),
      );
      expect(response.headers.get("set-cookie")).toContain(
        `${SESSION_COOKIE_NAME}=${SESSION_COOKIE_VALUE}`,
      );
    });

    it("returns the sign-up error payload", async () => {
      const payload = {
        operationName: AUTH_OPERATION_NAMES.signUp,
        query: getAuthDocument(AUTH_OPERATION_NAMES.signUp),
        variables: {
          input: {
            attributes: {
              email: "taken@example.com",
              name: "Existing User",
              password: "password123",
              passwordConfirmation: "password123",
            },
          },
        },
      };

      const response = await graphqlRoute(createNextRequest(payload));
      const result = await response.json();

      expect(result).toEqual(
        buildSignUpErrors([
          { message: "Email is already registered", path: ["attributes", "email"] },
        ]),
      );
    });

    it("returns the sign-out success payload", async () => {
      const payload = {
        operationName: AUTH_OPERATION_NAMES.signOut,
        query: getAuthDocument(AUTH_OPERATION_NAMES.signOut),
        variables: {
          input: {

          },
        },
      };

      const response = await graphqlRoute(createNextRequest(payload));
      const result = await response.json();

      expect(result).toEqual(buildSignOutSuccess());
      expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    });

    it("returns the viewer success payload", async () => {
      const payload = {
        operationName: AUTH_OPERATION_NAMES.viewer,
        query: getAuthDocument(AUTH_OPERATION_NAMES.viewer),
      };

      const response = await graphqlRoute(
        createNextRequest(payload, {
          cookie: `${SESSION_COOKIE_NAME}=${SESSION_COOKIE_VALUE}`,
        }),
      );
      const result = await response.json();

      expect(result).toEqual(buildViewerSuccess());
    });

    it("returns the viewer unauthorized envelope", async () => {
      const payload = {
        operationName: AUTH_OPERATION_NAMES.viewer,
        query: getAuthDocument(AUTH_OPERATION_NAMES.viewer),
      };

      const response = await graphqlRoute(createNextRequest(payload));
      const result = await response.json();

      expect(result).toEqual(buildUnauthorizedError());
    });
  });
});
