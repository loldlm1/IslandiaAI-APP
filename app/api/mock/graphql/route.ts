import { NextRequest, NextResponse } from "next/server";

import {
  mockAccessToken,
  mockRefreshToken,
  mockUser,
} from "@/src/mocks/handlers/auth";

interface GraphQLRequest {
  operationName?: string;
  variables?: Record<string, unknown>;
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, { status: 200, ...init });
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
        return jsonResponse({
          errors: [{ message: "Invalid credentials" }],
        });
      }

      return jsonResponse({
        data: {
          login: {
            accessToken: mockAccessToken,
            refreshToken: mockRefreshToken,
            user: {
              ...mockUser,
              email,
            },
          },
        },
      });
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
        return jsonResponse({
          errors: [{ message: "Email is already registered" }],
        });
      }

      return jsonResponse({
        data: {
          register: {
            user: {
              ...mockUser,
              id: "user_124",
              email,
              name,
            },
          },
        },
      });
    }
    case "Logout": {
      return jsonResponse({
        data: {
          logout: {
            success: true,
          },
        },
      });
    }
    case "Viewer": {
      const authHeader = request.headers.get("authorization");

      if (!authHeader || !authHeader.includes(mockAccessToken)) {
        return jsonResponse({
          errors: [{ message: "Unauthorized" }],
        });
      }

      return jsonResponse({
        data: {
          viewer: mockUser,
        },
      });
    }
    default: {
      const message = operation
        ? `Unhandled GraphQL operation: ${operation}`
        : "Missing GraphQL operation";

      return jsonResponse({
        errors: [{ message }],
      });
    }
  }
}
