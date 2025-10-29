import { NextRequest } from "next/server";

import { POST as graphqlRoute } from "@/app/api/mock/graphql/route";
import type { RequestHandler } from "msw";

import { handlers } from "@/src/mocks/handlers";
import { mockAccessToken } from "@/src/mocks/handlers/auth";
import {
  buildAuthError,
  buildLoginSuccess,
  buildLogoutSuccess,
  buildRegisterSuccess,
  buildUnauthorizedError,
  buildViewerSuccess,
} from "@/tests/mocks/graphql";

const GRAPHQL_ENDPOINT = "http://mock.api/graphql";
const GRAPHQL_DOCUMENTS: Record<string, string> = {
  Login: `
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        accessToken
        refreshToken
        tokenType
        expiresIn
        createdAt
      }
    }
  `,
  RegisterUser: `
    mutation RegisterUser($input: RegisterUserInput!) {
      registerUser(input: $input) {
        user {
          id
          email
          name
        }
      }
    }
  `,
  Logout: `
    mutation Logout($input: LogoutInput!) {
      logout(input: $input) {
        success
      }
    }
  `,
  Viewer: "query Viewer { viewer { id email name } }",
};

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
  const query = GRAPHQL_DOCUMENTS[operationName];

  if (!query) {
    throw new Error(`Missing GraphQL document for operation "${operationName}".`);
  }

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
    it("returns the login success payload", async () => {
      const result = await executeGraphQLHandler("Login", {
        variables: {
          input: {
            email: "user@example.com",
            password: "password123",
          },
        },
      });

      expect(result).toEqual(buildLoginSuccess());
    });

    it("returns the login error envelope", async () => {
      const result = await executeGraphQLHandler("Login", {
        variables: {
          input: {
            email: "user@example.com",
            password: "wrong",
          },
        },
      });

      expect(result).toEqual(buildAuthError("Invalid credentials"));
    });

    it("returns the register success payload", async () => {
      const result = await executeGraphQLHandler("RegisterUser", {
        variables: {
          input: {
            email: "new@example.com",
            name: "New User",
            password: "password123",
          },
        },
      });

      expect(result).toEqual(
        buildRegisterSuccess({
          email: "new@example.com",
          name: "New User",
        }),
      );
    });

    it("returns the register error envelope", async () => {
      const result = await executeGraphQLHandler("RegisterUser", {
        variables: {
          input: {
            email: "taken@example.com",
            name: "Existing User",
            password: "password123",
          },
        },
      });

      expect(result).toEqual(buildAuthError("Email is already registered"));
    });

    it("returns the logout success payload", async () => {
      const result = await executeGraphQLHandler(
        "Logout",
        {
          variables: {
            input: {
              token: mockAccessToken,
            },
          },
        },
        {
          authorization: `Bearer ${mockAccessToken}`,
        },
      );

      expect(result).toEqual(buildLogoutSuccess());
    });

    it("returns the viewer success payload", async () => {
      const result = await executeGraphQLHandler(
        "Viewer",
        {},
        {
          authorization: `Bearer ${mockAccessToken}`,
        },
      );

      expect(result).toEqual(buildViewerSuccess());
    });

    it("returns the viewer unauthorized envelope", async () => {
      const result = await executeGraphQLHandler("Viewer");

      expect(result).toEqual(buildUnauthorizedError());
    });
  });

  describe("Next.js route", () => {
    it("returns the login success payload", async () => {
      const payload = {
        operationName: "Login",
        query: GRAPHQL_DOCUMENTS.Login,
        variables: {
          input: {
            email: "user@example.com",
            password: "password123",
          },
        },
      };

      const response = await graphqlRoute(createNextRequest(payload));
      const result = await response.json();

      expect(result).toEqual(buildLoginSuccess());
    });

    it("returns the login error envelope", async () => {
      const payload = {
        operationName: "Login",
        query: GRAPHQL_DOCUMENTS.Login,
        variables: {
          input: {
            email: "user@example.com",
            password: "wrong",
          },
        },
      };

      const response = await graphqlRoute(createNextRequest(payload));
      const result = await response.json();

      expect(result).toEqual(buildAuthError("Invalid credentials"));
    });

    it("returns the register success payload", async () => {
      const payload = {
        operationName: "RegisterUser",
        query: GRAPHQL_DOCUMENTS.RegisterUser,
        variables: {
          input: {
            email: "new@example.com",
            name: "New User",
            password: "password123",
          },
        },
      };

      const response = await graphqlRoute(createNextRequest(payload));
      const result = await response.json();

      expect(result).toEqual(
        buildRegisterSuccess({
          email: "new@example.com",
          name: "New User",
        }),
      );
    });

    it("returns the register error envelope", async () => {
      const payload = {
        operationName: "RegisterUser",
        query: GRAPHQL_DOCUMENTS.RegisterUser,
        variables: {
          input: {
            email: "taken@example.com",
            name: "Existing User",
            password: "password123",
          },
        },
      };

      const response = await graphqlRoute(createNextRequest(payload));
      const result = await response.json();

      expect(result).toEqual(buildAuthError("Email is already registered"));
    });

    it("returns the logout success payload", async () => {
      const payload = {
        operationName: "Logout",
        query: GRAPHQL_DOCUMENTS.Logout,
        variables: {
          input: {
            token: mockAccessToken,
          },
        },
      };

      const response = await graphqlRoute(
        createNextRequest(payload, {
          authorization: `Bearer ${mockAccessToken}`,
        }),
      );
      const result = await response.json();

      expect(result).toEqual(buildLogoutSuccess());
    });

    it("returns the viewer success payload", async () => {
      const payload = {
        operationName: "Viewer",
        query: GRAPHQL_DOCUMENTS.Viewer,
      };

      const response = await graphqlRoute(
        createNextRequest(payload, {
          authorization: `Bearer ${mockAccessToken}`,
        }),
      );
      const result = await response.json();

      expect(result).toEqual(buildViewerSuccess());
    });

    it("returns the viewer unauthorized envelope", async () => {
      const payload = {
        operationName: "Viewer",
        query: GRAPHQL_DOCUMENTS.Viewer,
      };

      const response = await graphqlRoute(createNextRequest(payload));
      const result = await response.json();

      expect(result).toEqual(buildUnauthorizedError());
    });
  });
});
