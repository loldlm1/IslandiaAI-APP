import { graphql, HttpResponse } from "msw";

import type { LoginPayload, RegisterPayload } from "@/src/lib/auth/types";

export const mockAccessToken = "mock-access-token";
export const mockRefreshToken = "mock-refresh-token";

export const mockUser = {
  id: "user_123",
  name: "Isla Innovator",
  email: "isla@example.com",
};

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
        {
          errors: [
            {
              message: "Invalid credentials",
            },
          ],
        },
        { status: 200 },
      );
    }

    return HttpResponse.json({
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
  }),
  graphql.mutation<RegisterVariables>("Register", async ({ variables }) => {
    const { email, name } = variables.input;

    if (email === "taken@example.com") {
      return HttpResponse.json(
        {
          errors: [
            {
              message: "Email is already registered",
            },
          ],
        },
        { status: 200 },
      );
    }

    return HttpResponse.json({
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
  }),
  graphql.mutation("Logout", async () => {
    return HttpResponse.json({
      data: {
        logout: {
          success: true,
        },
      },
    });
  }),
];
