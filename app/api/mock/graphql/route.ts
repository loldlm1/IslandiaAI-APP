import { NextRequest } from "next/server";

import {
  buildAuthError,
  buildErrorResponse,
  buildLoginSuccess,
  buildLogoutSuccess,
  buildRegisterSuccess,
  buildUnauthorizedError,
  buildViewerSuccess,
  mockAccessToken,
  mockAuthUser,
} from "@/tests/mocks/graphql";

interface GraphQLRequest {
  operationName?: string;
  variables?: Record<string, unknown>;
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return Response.json(body, { status: 200, ...init });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as GraphQLRequest;
  const operation = body.operationName;

  switch (operation) {
    case "Login": {
      const variables = (body.variables ?? {}) as {
        input?: Partial<{ email: string; password: string }>;
      };
      const password = variables.input?.password ?? "";

      if (password !== "password123") {
        return jsonResponse(buildAuthError("Invalid credentials"));
      }

      return jsonResponse(buildLoginSuccess());
    }
    case "RegisterUser": {
      const variables = (body.variables ?? {}) as {
        input?: Partial<{ email: string; name: string }>;
      };
      const email = variables.input?.email ?? "";
      const name = variables.input?.name ?? mockAuthUser.name;

      if (email === "taken@example.com") {
        return jsonResponse(buildAuthError("Email is already registered"));
      }

      return jsonResponse(
        buildRegisterSuccess({
          email,
          name,
        }),
      );
    }
    case "Logout": {
      return jsonResponse(buildLogoutSuccess());
    }
    case "Viewer": {
      const authHeader = request.headers.get("authorization");

      if (!authHeader || !authHeader.includes(mockAccessToken)) {
        return jsonResponse(buildUnauthorizedError());
      }

      return jsonResponse(buildViewerSuccess());
    }
    default: {
      const message = operation
        ? `Unhandled GraphQL operation: ${operation}`
        : "Missing GraphQL operation";

      return jsonResponse(buildErrorResponse(message), { status: 400 });
    }
  }
}
