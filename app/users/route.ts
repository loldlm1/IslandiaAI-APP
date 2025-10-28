import { NextRequest } from "next/server";

import { buildAuthError, buildRegisterSuccess, mockAuthUser } from "@/tests/mocks/graphql";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    user?: { email?: string; name?: string };
  };
  const user = body.user ?? {};
  const email = user.email ?? "";
  const name = user.name ?? mockAuthUser.name;

  if (email === "taken@example.com") {
    return Response.json(buildAuthError("Email is already registered"), {
      status: 422,
    });
  }

  return Response.json(
    buildRegisterSuccess({
      email,
      name,
    }),
    { status: 201 },
  );
}
