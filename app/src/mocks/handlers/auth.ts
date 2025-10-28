import { graphql, HttpResponse } from "msw";

import type { LoginPayload, RegisterPayload } from "@/src/lib/auth/types";

const ACCESS_TOKEN = "mock-access-token";
const REFRESH_TOKEN = "mock-refresh-token";

const baseUser = {
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
          accessToken: ACCESS_TOKEN,
          refreshToken: REFRESH_TOKEN,
          user: {
            ...baseUser,
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
            ...baseUser,
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
  graphql.query("Viewer", async ({ request }) => {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.includes(ACCESS_TOKEN)) {
      return HttpResponse.json(
        {
          errors: [
            {
              message: "Unauthorized",
            },
          ],
        },
        { status: 200 },
      );
    }

    return HttpResponse.json({
      data: {
        viewer: baseUser,
      },
    });
  }),
];
