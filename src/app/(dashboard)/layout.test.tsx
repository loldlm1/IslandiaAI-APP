import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { Session } from "next-auth";

import ProtectedLayout from "@/src/app/(dashboard)/layout";
import { auth } from "@/src/lib/auth/session";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/src/app/(dashboard)/DashboardAppShell", () => ({
  DashboardAppShell: ({ children }: { children: ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
}));

jest.mock("@/src/lib/auth/session");

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

const authMock = auth as jest.MockedFunction<typeof auth>;
const { redirect } = jest.requireMock("next/navigation") as {
  redirect: jest.Mock;
};

function createSession(overrides: Partial<Session> = {}): Session {
  return {
    user: {
      id: "user-123",
      email: "user@example.com",
      name: "Test User",
    },
    expires: new Date(Date.now() + 60_000).toISOString(),
    ...overrides,
  } as Session;
}

describe("ProtectedLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects unauthenticated users to the sign-in page", async () => {
    authMock.mockResolvedValueOnce(null);
    redirect.mockImplementationOnce(() => {
      throw new Error("redirect");
    });

    await expect(
      ProtectedLayout({ children: <p>Should not render</p> }),
    ).rejects.toThrow("redirect");

    expect(redirect).toHaveBeenCalledWith("/signin");
  });

  it("renders the dashboard shell when a session exists", async () => {
    const session = createSession();
    authMock.mockResolvedValueOnce(session);

    const result = await ProtectedLayout({
      children: <p>Welcome back!</p>,
    });

    render(result);

    expect(redirect).not.toHaveBeenCalled();
    expect(screen.getByTestId("dashboard-shell")).toHaveTextContent(
      "Welcome back!",
    );
  });
});
