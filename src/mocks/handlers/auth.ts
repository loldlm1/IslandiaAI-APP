import { http, HttpResponse } from "msw";

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
  http.post("*/oauth/token", async ({ request }) => {
    const body = (await request.json()) as Partial<LoginPayload> & {
      username?: string;
    };
    const password = body.password ?? "";

    if (password !== "password123") {
      return HttpResponse.json(buildAuthError("Invalid credentials"), {
        status: 401,
      });
    }

    return HttpResponse.json(buildLoginSuccess(), { status: 200 });
  }),
  http.post("*/users", async ({ request }) => {
    const body = (await request.json()) as { user?: RegisterPayload };
    const user = body.user ?? ({} as RegisterPayload);
    const email = user.email ?? "";
    const name = user.name ?? mockAuthUser.name;

    if (email === "taken@example.com") {
      return HttpResponse.json(
        buildAuthError("Email is already registered"),
        { status: 422 },
      );
    }

    return HttpResponse.json(
      buildRegisterSuccess({
        email,
        name,
      }),
      { status: 201 },
    );
  }),
  http.post("*/oauth/revoke", async () => {
    return HttpResponse.json(buildLogoutSuccess(), { status: 200 });
  }),
];
