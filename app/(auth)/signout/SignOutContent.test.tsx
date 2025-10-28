import { render, screen, waitFor } from "@testing-library/react";

import SignOutContent from "./SignOutContent";

import { getSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

import { logout } from "@/src/lib/auth/api";

jest.mock("next-auth/react", () => ({
  getSession: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/src/lib/auth/api", () => {
  const actual = jest.requireActual("@/src/lib/auth/api");
  return {
    ...actual,
    logout: jest.fn(),
  };
});

describe("SignOutContent", () => {
  const replace = jest.fn();
  const refresh = jest.fn();
  const useRouterMock = useRouter as jest.MockedFunction<typeof useRouter>;
  const getSessionMock = getSession as jest.MockedFunction<typeof getSession>;
  const signOutMock = signOut as jest.MockedFunction<typeof signOut>;
  const logoutMock = logout as jest.MockedFunction<typeof logout>;

  beforeEach(() => {
    jest.clearAllMocks();
    useRouterMock.mockReturnValue({
      replace,
      refresh,
    } as unknown as ReturnType<typeof useRouter>);
  });

  it("signs out successfully and redirects to sign in", async () => {
    getSessionMock.mockResolvedValue({
      accessToken: "token-123",
    } as unknown as Awaited<ReturnType<typeof getSession>>);
    logoutMock.mockResolvedValue(undefined);
    signOutMock.mockResolvedValue(undefined as never);

    render(<SignOutContent />);

    expect(
      screen.getByText("One moment while we securely end your session."),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(logoutMock).toHaveBeenCalledWith({ accessToken: "token-123" }),
    );
    await waitFor(() =>
      expect(signOutMock).toHaveBeenCalledWith({ redirect: false }),
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          "You have been signed out. Redirecting you to the sign-in page.",
        ),
      ).toBeInTheDocument(),
    );

    expect(replace).toHaveBeenCalledWith("/signin");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("shows an error message when sign out fails", async () => {
    getSessionMock.mockResolvedValue({
      accessToken: "token-456",
    } as unknown as Awaited<ReturnType<typeof getSession>>);
    logoutMock.mockRejectedValue(new Error("Network error"));

    render(<SignOutContent />);

    await waitFor(() =>
      expect(
        screen.getByText("We couldn't complete your sign out. Please try again."),
      ).toBeInTheDocument(),
    );

    expect(signOutMock).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});
