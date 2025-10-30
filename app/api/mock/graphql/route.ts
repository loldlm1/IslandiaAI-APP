import { NextRequest } from "next/server";

import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_VALUE,
  buildErrorResponse,
  dispatchAuthOperation,
  mockAuthUser,
} from "@/tests/mocks/services/auth";

let sessionUser = mockAuthUser;

interface GraphQLRequest {
  operationName?: string;
  variables?: Record<string, unknown>;
  locale?: string;
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return Response.json(body, { status: 200, ...init });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as GraphQLRequest;
  const operation = body.operationName;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const hasSessionCookie = cookieHeader.includes(`${SESSION_COOKIE_NAME}=${SESSION_COOKIE_VALUE}`);

  const response = dispatchAuthOperation(operation, body.variables, {
    hasSessionCookie,
    sessionUser,
    setSessionUser(nextUser) {
      sessionUser = nextUser;
    },
    clearSessionUser() {
      sessionUser = mockAuthUser;
    },
  });

  if (!response) {
    const message = operation
      ? `Unhandled GraphQL operation: ${operation}`
      : "Missing GraphQL operation";

    return jsonResponse(buildErrorResponse(message), { status: 400 });
  }

  return jsonResponse(response.body, response.init);
}
