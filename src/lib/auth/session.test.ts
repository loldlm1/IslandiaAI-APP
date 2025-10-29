import type { Session } from "next-auth";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("./api", () => ({
  fetchViewer: jest.fn(),
}));

jest.mock("next/headers", () => ({
  headers: jest.fn(),
}));

import { auth } from "./session";
import { fetchViewer } from "./api";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";

describe("auth", () => {
  const getServerSessionMock = getServerSession as jest.MockedFunction<typeof getServerSession>;
  const fetchViewerMock = fetchViewer as jest.MockedFunction<typeof fetchViewer>;
  const headersMock = headers as jest.MockedFunction<typeof headers>;

  function createSession(overrides: Partial<Session["user"]> = {}): Session {
    return {
      user: {
        id: "session-id",
        email: "session@example.com",
        name: "Session User",
        ...overrides,
      },
      expires: new Date(Date.now() + 60_000).toISOString(),
    } as Session;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    headersMock.mockReturnValue(new Headers({ cookie: "locale=en; islandia_session=abc123" }));
  });

  it("merges viewer details without logging errors", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const session = createSession({ name: undefined });
    const viewer = {
      id: "viewer-id",
      email: "viewer@example.com",
      name: "Viewer Name",
    };

    getServerSessionMock.mockResolvedValueOnce(session);
    fetchViewerMock.mockResolvedValueOnce(viewer);

    const result = await auth();

    expect(result).not.toBeNull();
    expect(fetchViewerMock).toHaveBeenCalledWith({
      headers: { cookie: "locale=en; islandia_session=abc123" },
      locale: "en",
    });
    expect(result?.user).toEqual({
      id: viewer.id,
      email: viewer.email,
      name: viewer.name,
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("returns the base session when the viewer is unavailable", async () => {
    const session = createSession();
    getServerSessionMock.mockResolvedValueOnce(session);
    fetchViewerMock.mockResolvedValueOnce(null);

    const result = await auth();

    expect(result).toEqual(session);
  });

  it("returns null when no session exists", async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const result = await auth();

    expect(result).toBeNull();
    expect(fetchViewerMock).not.toHaveBeenCalled();
  });
});
