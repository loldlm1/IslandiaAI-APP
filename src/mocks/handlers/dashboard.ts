import { graphql, HttpResponse } from "msw";

import { mockAccessToken, mockUser } from "./auth";

export const dashboardHandlers = [
  graphql.query("Viewer", async ({ request }) => {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.includes(mockAccessToken)) {
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
        viewer: mockUser,
      },
    });
  }),
];
