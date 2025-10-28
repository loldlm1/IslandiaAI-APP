import { graphql, HttpResponse } from "msw";

import type { LoginPayload, RegisterPayload } from "@/src/lib/auth/types";
import {
  buildErrorResponse,
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

interface LoginVariables {
  input: LoginPayload;
}

interface RegisterVariables {
  input: RegisterPayload;
}

export const authHandlers = [
  graphql.mutation<LoginVariables>("Login", async ({ variables }) => {
    const { email, password } = variables.input;

    if (password !== "password123") {
      return HttpResponse.json(
        buildErrorResponse("Invalid credentials"),
        { status: 200 },
      );
    }

    return HttpResponse.json(
      buildLoginSuccess({
        user: { email },
      }),
    );
  }),
  graphql.mutation<RegisterVariables>("Register", async ({ variables }) => {
    const { email, name } = variables.input;

    if (email === "taken@example.com") {
      return HttpResponse.json(
        buildErrorResponse("Email is already registered"),
        { status: 200 },
      );
    }

    return HttpResponse.json(
      buildRegisterSuccess({
        email,
        name,
      }),
    );
  }),
  graphql.mutation("Logout", async () => {
    return HttpResponse.json(buildLogoutSuccess());
  }),
];
