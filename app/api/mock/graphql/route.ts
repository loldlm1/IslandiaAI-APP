import { NextRequest } from "next/server";

import {
  buildErrorResponse,
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
