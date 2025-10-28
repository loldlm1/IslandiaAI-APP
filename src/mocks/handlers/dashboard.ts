import { graphql, HttpResponse } from "msw";

import {
  buildUnauthorizedError,
  buildViewerSuccess,
  mockAccessToken,
} from "@/tests/mocks/graphql";

export const dashboardHandlers = [
  graphql.query("Viewer", async ({ request }) => {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.includes(mockAccessToken)) {
      return HttpResponse.json(buildUnauthorizedError(), { status: 200 });
    }

    return HttpResponse.json(buildViewerSuccess());
  }),
];
