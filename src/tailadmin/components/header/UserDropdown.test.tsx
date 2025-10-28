import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import UserDropdown from "./UserDropdown";

import { signOut, useSession } from "next-auth/react";

import { logout } from "@/src/lib/auth/api";

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("@/src/lib/auth/api", () => {
  const actual = jest.requireActual("@/src/lib/auth/api");
  return {
    ...actual,
    logout: jest.fn(),
  };
});

describe("UserDropdown", () => {
  const useSessionMock = useSession as jest.MockedFunction<typeof useSession>;
  const signOutMock = signOut as jest.MockedFunction<typeof signOut>;
  const logoutMock = logout as jest.MockedFunction<typeof logout>;

  function createDeferred<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }

  const renderComponent = () => {
    render(<UserDropdown />);
    fireEvent.click(screen.getByRole("button", { name: /test user/i }));
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useSessionMock.mockReturnValue({
      data: {
        user: { name: "Test User", email: "test@example.com" },
        accessToken: "token-abc",
      },
      status: "authenticated",
      update: jest.fn(),
    } as unknown as ReturnType<typeof useSession>);
    signOutMock.mockResolvedValue(undefined as never);
    logoutMock.mockResolvedValue(undefined);
  });

  it("disables the sign out action while the request is in flight", async () => {
    const logoutDeferred = createDeferred<void>();
    const signOutDeferred = createDeferred<void>();
    logoutMock.mockReturnValueOnce(logoutDeferred.promise);
    signOutMock.mockReturnValueOnce(signOutDeferred.promise as never);

    renderComponent();

    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    // Re-open the dropdown to inspect the disabled state while signing out.
    fireEvent.click(screen.getByRole("button", { name: /test user/i }));

    const signingOutButton = await screen.findByRole("button", {
      name: /signing out/i,
    });

    expect(signingOutButton).toHaveClass("pointer-events-none");
    expect(signingOutButton).toHaveClass("opacity-60");

    logoutDeferred.resolve();
    await waitFor(() =>
      expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: "/signin" }),
    );

    signOutDeferred.resolve();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument(),
    );
  });

  it("passes the active access token to the logout mutation", async () => {
    renderComponent();

    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() =>
      expect(logoutMock).toHaveBeenCalledWith({ accessToken: "token-abc" }),
    );
    await waitFor(() =>
      expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: "/signin" }),
    );
  });

  it("continues signing out even if revoking the session fails", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    logoutMock.mockRejectedValueOnce(new Error("Failed to revoke"));

    renderComponent();

    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() =>
      expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: "/signin" }),
    );

    fireEvent.click(screen.getByRole("button", { name: /test user/i }));

    const signOutButton = await screen.findByRole("button", {
      name: /sign out/i,
    });

    expect(signOutButton).not.toHaveClass("pointer-events-none");
    expect(signOutButton).not.toHaveClass("opacity-60");

    consoleErrorSpy.mockRestore();
  });
});
