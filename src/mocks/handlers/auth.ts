import { graphql, HttpResponse } from "msw";

import type { SignInPayload, SignUpPayload, UserErrorPayload } from "@/src/lib/auth/types";
import { buildSignInErrors, buildSignInSuccess, buildSignOutSuccess, buildSignUpErrors, buildSignUpSuccess, mockAuthUser } from "@/tests/mocks/graphql";

const SESSION_COOKIE_NAME = "islandia_session";
const SESSION_COOKIE_VALUE = "mock-session";

export const mockUser = mockAuthUser;

export const authHandlers = [
  graphql.mutation("SignIn", async ({ variables }) => {
    const input = (variables as { input?: { credentials?: SignInPayload } })?.input ?? {};
    const password = input.credentials?.password ?? "";

    if (password !== "password123") {
      const errors: UserErrorPayload[] = [
        { message: "Invalid credentials", path: ["credentials", "password"] },
      ];
      return HttpResponse.json(buildSignInErrors(errors), { status: 200 });
    }

    return HttpResponse.json(buildSignInSuccess(), {
      status: 200,
      headers: {
        "Set-Cookie": `${SESSION_COOKIE_NAME}=${SESSION_COOKIE_VALUE}; Path=/; HttpOnly`,
      },
    });
  }),
  graphql.mutation("SignUp", async ({ variables }) => {
    const input = (variables as {
      input?: { attributes?: Partial<SignUpPayload> };
    })?.input ?? { attributes: {} };
    const attributes = input.attributes ?? {};
    const email = attributes.email ?? "";
    const name = attributes.name ?? mockAuthUser.name;

    if (email === "taken@example.com") {
      const errors: UserErrorPayload[] = [
        { message: "Email is already registered", path: ["attributes", "email"] },
      ];
      return HttpResponse.json(buildSignUpErrors(errors), { status: 200 });
    }

    return HttpResponse.json(
      buildSignUpSuccess({
        email,
        name,
      }),
      {
        status: 200,
        headers: {
          "Set-Cookie": `${SESSION_COOKIE_NAME}=${SESSION_COOKIE_VALUE}; Path=/; HttpOnly`,
        },
      },
    );
  }),
  graphql.mutation("SignOut", async () => {
    return HttpResponse.json(buildSignOutSuccess(), {
      status: 200,
      headers: {
        "Set-Cookie": `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly`,
      },
    });
  }),
];
