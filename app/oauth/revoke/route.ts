import { buildLogoutSuccess } from "@/tests/mocks/graphql";

export async function POST() {
  return Response.json(buildLogoutSuccess(), { status: 200 });
}
