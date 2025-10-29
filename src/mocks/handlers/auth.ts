import { graphql, HttpResponse } from "msw";

import type { LoginPayload, RegisterPayload } from "@/src/lib/auth/types";
import {
  buildAuthError,
  buildLoginSuccess,
  buildLogoutSuccess,
  buildRegisterSuccess,
  mockAccessToken as factoryAccessToken,
  mockAuthUser,
  mockRefreshToken as factoryRefreshToken,
} from "@/tests/mocks/graphql";

export const mockAccessToken = factoryAccessToken;
export const mockRefreshToken = factoryRefreshToken ?? undefined;
export const mockUser = mockAuthUser;

export const authHandlers = [
  graphql.mutation("Login", async ({ variables }) => {
    const input = (variables as { input?: Partial<LoginPayload> })?.input ?? {};
    const password = input.password ?? "";

    if (password !== "password123") {
      return HttpResponse.json(buildAuthError("Invalid credentials"), {
        status: 200,
      });
    }

    return HttpResponse.json(buildLoginSuccess(), { status: 200 });
  }),
  graphql.mutation("RegisterUser", async ({ variables }) => {
    const input = (variables as { input?: RegisterPayload })?.input ??
      ({} as RegisterPayload);
    const email = input.email ?? "";
    const name = input.name ?? mockAuthUser.name;

    if (email === "taken@example.com") {
      return HttpResponse.json(buildAuthError("Email is already registered"), {
        status: 200,
      });
    }

    return HttpResponse.json(
      buildRegisterSuccess({
        email,
        name,
      }),
      { status: 200 },
    );
  }),
  graphql.mutation("Logout", async () => {
    return HttpResponse.json(buildLogoutSuccess(), { status: 200 });
  }),
];
