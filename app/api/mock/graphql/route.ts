import { NextRequest } from "next/server";

import {
  buildAuthUser,
  buildErrorResponse,
  buildSignInErrors,
  buildSignInSuccess,
  buildSignOutSuccess,
  buildSignUpErrors,
  buildSignUpSuccess,
  buildUnauthorizedError,
  buildViewerSuccess,
  mockAuthUser,
} from "@/tests/mocks/graphql";

const SESSION_COOKIE_NAME = "islandia_session";
const SESSION_COOKIE_VALUE = "mock-session";

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

  switch (operation) {
    case "SignIn": {
      const variables = (body.variables ?? {}) as {
        input?: { credentials?: { email?: string; password?: string } };
      };
      const email = variables.input?.credentials?.email ?? mockAuthUser.email;
      const password = variables.input?.credentials?.password ?? "";

      if (password !== "password123") {
        return jsonResponse(
          buildSignInErrors([
            { message: "Invalid credentials", path: ["credentials", "password"] },
          ]),
        );
      }

      sessionUser = buildAuthUser({ email });

      return jsonResponse(buildSignInSuccess({ email }), {
        headers: {
          "Set-Cookie": `${SESSION_COOKIE_NAME}=${SESSION_COOKIE_VALUE}; Path=/; HttpOnly`,
        },
      });
    }
    case "SignUp": {
      const variables = (body.variables ?? {}) as {
        input?: { attributes?: { email?: string; name?: string } };
      };
      const email = variables.input?.attributes?.email ?? "";
      const name = variables.input?.attributes?.name ?? mockAuthUser.name;

      if (email === "taken@example.com") {
        return jsonResponse(
          buildSignUpErrors([{ message: "Email is already registered", path: ["attributes", "email"] }]),
        );
      }

      sessionUser = buildAuthUser({ id: "user_124", email, name });

      return jsonResponse(
        buildSignUpSuccess({
          email,
          name,
        }),
        {
          headers: {
            "Set-Cookie": `${SESSION_COOKIE_NAME}=${SESSION_COOKIE_VALUE}; Path=/; HttpOnly`,
          },
        },
      );
    }
    case "SignOut": {
      sessionUser = mockAuthUser;
      return jsonResponse(buildSignOutSuccess(), {
        headers: {
          "Set-Cookie": `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly`,
        },
      });
    }
    case "Viewer": {
      if (!hasSessionCookie) {
        return jsonResponse(buildUnauthorizedError());
      }

      return jsonResponse(buildViewerSuccess(sessionUser));
    }
    default: {
      const message = operation
        ? `Unhandled GraphQL operation: ${operation}`
        : "Missing GraphQL operation";

      return jsonResponse(buildErrorResponse(message), { status: 400 });
    }
  }
}
