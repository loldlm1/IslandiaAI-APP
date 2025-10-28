import { NextRequest } from "next/server";

import {
  buildErrorResponse,
  buildLoginSuccess,
  buildLogoutSuccess,
  buildRegisterSuccess,
  buildUnauthorizedError,
  buildViewerSuccess,
  mockAccessToken,
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
      const variables = body.variables as { input?: Record<string, unknown> };
      const input = variables?.input as { email?: string; password?: string };
      const email = input?.email ?? "";
      const password = input?.password ?? "";

      if (password !== "password123") {
        return jsonResponse(buildErrorResponse("Invalid credentials"));
      }

      return jsonResponse(
        buildLoginSuccess({
          user: { email },
        }),
      );
    }
    case "Register": {
      const variables = body.variables as { input?: Record<string, unknown> };
      const input = variables?.input as {
        email?: string;
        name?: string;
      };
      const email = input?.email ?? "";
      const name = input?.name ?? "";

      if (email === "taken@example.com") {
        return jsonResponse(
          buildErrorResponse("Email is already registered"),
        );
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

      return jsonResponse(buildErrorResponse(message));
    }
  }
}
