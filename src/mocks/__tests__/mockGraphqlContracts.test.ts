import { NextRequest } from "next/server";

import { POST } from "@/app/api/mock/graphql/route";
import type { RequestHandler } from "msw";

import { handlers } from "@/src/mocks/handlers";
import { mockAccessToken } from "@/src/mocks/handlers/auth";
import {
  buildErrorResponse,
  buildLoginSuccess,
  buildLogoutSuccess,
  buildRegisterSuccess,
  buildUnauthorizedError,
  buildViewerSuccess,
} from "@/tests/mocks/graphql";

const GRAPHQL_ENDPOINT = "http://mock.api/graphql";
const GRAPHQL_DOCUMENTS: Record<string, string> = {
  Login: "mutation Login($input: LoginInput!) { login(input: $input) { accessToken refreshToken user { id email name } } }",
  Register:
    "mutation Register($input: RegisterInput!) { register(input: $input) { user { id email name } } }",
  Logout: "mutation Logout { logout { success } }",
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
  info: RequestHandler["info"] & {
    operationName?: string | RegExp;
  };
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

async function executeHandler(
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

describe("mock GraphQL contract parity", () => {
  describe("MSW handlers", () => {
    it("returns the login success payload", async () => {
      const payload = {
        variables: {
          input: {
            email: "user@example.com",
            password: "password123",
          },
        },
      };

      const result = await executeHandler("Login", payload);

      expect(result).toEqual(
        buildLoginSuccess({
          user: { email: "user@example.com" },
        }),
      );
    });

    it("returns the login error envelope", async () => {
      const payload = {
        variables: {
          input: {
            email: "user@example.com",
            password: "wrong",
          },
        },
      };

      const result = await executeHandler("Login", payload);

      expect(result).toEqual(buildErrorResponse("Invalid credentials"));
    });

    it("returns the register success payload", async () => {
      const payload = {
        variables: {
          input: {
            email: "new@example.com",
            name: "New User",
            password: "password123",
          },
        },
      };

      const result = await executeHandler("Register", payload);

      expect(result).toEqual(
        buildRegisterSuccess({
          email: "new@example.com",
          name: "New User",
        }),
      );
    });

    it("returns the register error envelope", async () => {
      const payload = {
        variables: {
          input: {
            email: "taken@example.com",
            name: "Existing User",
            password: "password123",
          },
        },
      };

      const result = await executeHandler("Register", payload);

      expect(result).toEqual(
        buildErrorResponse("Email is already registered"),
      );
    });

    it("returns the logout success payload", async () => {
      const result = await executeHandler("Logout");

      expect(result).toEqual(buildLogoutSuccess());
    });

    it("returns the viewer success payload", async () => {
      const result = await executeHandler(
        "Viewer",
        {},
        {
          authorization: `Bearer ${mockAccessToken}`,
        },
      );

      expect(result).toEqual(buildViewerSuccess());
    });

    it("returns the viewer unauthorized envelope", async () => {
      const result = await executeHandler("Viewer");

      expect(result).toEqual(buildUnauthorizedError());
    });
  });

  describe("Next.js route", () => {
    it("returns the login success payload", async () => {
      const payload = {
        operationName: "Login",
        variables: {
          input: {
            email: "user@example.com",
            password: "password123",
          },
        },
      };

      const response = await POST(createNextRequest(payload));
      const result = await response.json();

      expect(result).toEqual(
        buildLoginSuccess({
          user: { email: "user@example.com" },
        }),
      );
    });

    it("returns the login error envelope", async () => {
      const payload = {
        operationName: "Login",
        variables: {
          input: {
            email: "user@example.com",
            password: "wrong",
          },
        },
      };

      const response = await POST(createNextRequest(payload));
      const result = await response.json();

      expect(result).toEqual(buildErrorResponse("Invalid credentials"));
    });

    it("returns the register success payload", async () => {
      const payload = {
        operationName: "Register",
        variables: {
          input: {
            email: "new@example.com",
            name: "New User",
            password: "password123",
          },
        },
      };

      const response = await POST(createNextRequest(payload));
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
        operationName: "Register",
        variables: {
          input: {
            email: "taken@example.com",
            name: "Existing User",
            password: "password123",
          },
        },
      };

      const response = await POST(createNextRequest(payload));
      const result = await response.json();

      expect(result).toEqual(
        buildErrorResponse("Email is already registered"),
      );
    });

    it("returns the logout success payload", async () => {
      const payload = {
        operationName: "Logout",
      };

      const response = await POST(createNextRequest(payload));
      const result = await response.json();

      expect(result).toEqual(buildLogoutSuccess());
    });

    it("returns the viewer success payload", async () => {
      const payload = {
        operationName: "Viewer",
      };

      const response = await POST(
        createNextRequest(payload, {
          authorization: `Bearer ${mockAccessToken}`,
        }),
      );
      const result = await response.json();

      expect(result).toEqual(buildViewerSuccess());
    });

    it("shares the unauthorized viewer envelope with MSW", async () => {
      const payload = {
        operationName: "Viewer",
      };

      const [handlerResult, response] = await Promise.all([
        executeHandler("Viewer", payload),
        POST(createNextRequest(payload)),
      ]);
      const routeResult = await response.json();

      expect(handlerResult).toEqual(buildUnauthorizedError());
      expect(routeResult).toEqual(buildUnauthorizedError());
      expect(routeResult).toEqual(handlerResult);
    });
  });
});
