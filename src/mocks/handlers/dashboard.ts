import { graphql, HttpResponse } from "msw";

import { viewerService } from "@/src/services/graphql/auth";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_VALUE,
  buildUnauthorizedError,
  buildViewerSuccess,
} from "@/tests/mocks/services/auth";

export const dashboardHandlers = [
  graphql.query(viewerService.operationName, async ({ request }) => {
    const cookieHeader = request.headers.get("cookie") ?? "";

    if (!cookieHeader.includes(`${SESSION_COOKIE_NAME}=${SESSION_COOKIE_VALUE}`)) {
      return HttpResponse.json(buildUnauthorizedError(), { status: 200 });
    }

    return HttpResponse.json(buildViewerSuccess());
  }),
];
