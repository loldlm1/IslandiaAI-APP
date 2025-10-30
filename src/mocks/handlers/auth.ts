import { graphql, HttpResponse } from "msw";

import { signInService, signOutService, signUpService } from "@/src/services/graphql/auth";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_VALUE,
  dispatchAuthOperation,
  mockAuthUser,
} from "@/tests/mocks/services/auth";

export const mockUser = mockAuthUser;

let sessionUser = mockAuthUser;

function resolveSessionCookie(request: Request): boolean {
  const cookieHeader = request.headers.get("cookie") ?? "";
  return cookieHeader.includes(`${SESSION_COOKIE_NAME}=${SESSION_COOKIE_VALUE}`);
}

function createResponseInit(init: ResponseInit | undefined): ResponseInit {
  if (!init) {
    return { status: 200 };
  }

  const { status = 200, headers, statusText } = init;
  const resolvedHeaders = headers ? new Headers(headers) : undefined;

  return {
    status,
    statusText,
    headers: resolvedHeaders,
  };
}

export const authHandlers = [
  graphql.mutation(signInService.operationName, async ({ variables, request }) => {
    const response = dispatchAuthOperation(signInService.operationName, variables, {
      hasSessionCookie: resolveSessionCookie(request),
      sessionUser,
      setSessionUser(nextUser) {
        sessionUser = nextUser;
      },
      clearSessionUser() {
        sessionUser = mockAuthUser;
      },
    });

    const init = createResponseInit(response?.init);

    return HttpResponse.json(response?.body ?? {}, init);
  }),
  graphql.mutation(signUpService.operationName, async ({ variables, request }) => {
    const response = dispatchAuthOperation(signUpService.operationName, variables, {
      hasSessionCookie: resolveSessionCookie(request),
      sessionUser,
      setSessionUser(nextUser) {
        sessionUser = nextUser;
      },
      clearSessionUser() {
        sessionUser = mockAuthUser;
      },
    });

    const init = createResponseInit(response?.init);

    return HttpResponse.json(response?.body ?? {}, init);
  }),
  graphql.mutation(signOutService.operationName, async ({ variables, request }) => {
    const response = dispatchAuthOperation(signOutService.operationName, variables, {
      hasSessionCookie: resolveSessionCookie(request),
      sessionUser,
      setSessionUser(nextUser) {
        sessionUser = nextUser;
      },
      clearSessionUser() {
        sessionUser = mockAuthUser;
      },
    });

    const init = createResponseInit(response?.init);

    return HttpResponse.json(response?.body ?? {}, init);
  }),
];
