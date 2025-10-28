import { NextRequest } from "next/server";

import { buildAuthError, buildLoginSuccess } from "@/tests/mocks/graphql";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { password?: string };
  const password = body.password ?? "";

  if (password !== "password123") {
    return Response.json(buildAuthError("Invalid credentials"), {
      status: 401,
    });
  }

  return Response.json(buildLoginSuccess(), { status: 200 });
}
