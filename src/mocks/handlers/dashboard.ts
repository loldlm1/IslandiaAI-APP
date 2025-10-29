import { graphql, HttpResponse } from "msw";

import { buildUnauthorizedError, buildViewerSuccess } from "@/tests/mocks/graphql";

const SESSION_COOKIE_NAME = "islandia_session";
const SESSION_COOKIE_VALUE = "mock-session";

export const dashboardHandlers = [
  graphql.query("Viewer", async ({ request }) => {
    const cookieHeader = request.headers.get("cookie") ?? "";

    if (!cookieHeader.includes(`${SESSION_COOKIE_NAME}=${SESSION_COOKIE_VALUE}`)) {
      return HttpResponse.json(buildUnauthorizedError(), { status: 200 });
    }

    return HttpResponse.json(buildViewerSuccess());
  }),
];
