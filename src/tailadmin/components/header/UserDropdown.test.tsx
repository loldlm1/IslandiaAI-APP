import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { signOut, useSession } from "next-auth/react";

import { signOut as signOutMutation } from "@/src/lib/auth/api";
import type { SignOutResult } from "@/src/lib/auth/types";
import { DEFAULT_LOCALE } from "@/src/lib/locale/constants";
import { LocaleProvider } from "@tailadmin/context/LocaleContext";

import UserDropdown from "./UserDropdown";

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("@/src/lib/auth/api", () => {
  const actual = jest.requireActual("@/src/lib/auth/api");
  return {
    ...actual,
    signOut: jest.fn(),
  };
});

describe("UserDropdown", () => {
  const useSessionMock = useSession as jest.MockedFunction<typeof useSession>;
  const signOutMock = signOut as jest.MockedFunction<typeof signOut>;
  const signOutMutationMock = signOutMutation as jest.MockedFunction<typeof signOutMutation>;

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
    render(
      <LocaleProvider initialLocale={DEFAULT_LOCALE}>
        <UserDropdown />
      </LocaleProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /test user/i }));
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useSessionMock.mockReturnValue({
      data: {
        user: { name: "Test User", email: "test@example.com" },
      },
      status: "authenticated",
      update: jest.fn(),
    } as unknown as ReturnType<typeof useSession>);
    signOutMock.mockResolvedValue(undefined as never);
    signOutMutationMock.mockResolvedValue({ user: null, userErrors: [], setCookies: [] });
  });

  it("disables the sign out action while the request is in flight", async () => {
    const mutationDeferred = createDeferred<SignOutResult>();
    const signOutDeferred = createDeferred<void>();
    signOutMutationMock.mockReturnValueOnce(mutationDeferred.promise);
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

    mutationDeferred.resolve({ user: null, userErrors: [], setCookies: [] });
    await waitFor(() => expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: "/signin" }));
    expect(signOutMutationMock).toHaveBeenCalledWith({ locale: DEFAULT_LOCALE });

    signOutDeferred.resolve();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument(),
    );
  });

  it("continues signing out even if revoking the session fails", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    signOutMutationMock.mockRejectedValueOnce(new Error("Failed to revoke"));

    renderComponent();

    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() =>
      expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: "/signin" }),
    );
    expect(signOutMutationMock).toHaveBeenCalledWith({ locale: DEFAULT_LOCALE });

    fireEvent.click(screen.getByRole("button", { name: /test user/i }));

    const signOutButton = await screen.findByRole("button", {
      name: /sign out/i,
    });

    expect(signOutButton).not.toHaveClass("pointer-events-none");
    expect(signOutButton).not.toHaveClass("opacity-60");

    consoleErrorSpy.mockRestore();
  });

  it("logs when the API returns user errors", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    signOutMutationMock.mockResolvedValueOnce({
      user: null,
      userErrors: [{ message: "Session could not be closed", path: [] }],
      setCookies: [],
    });

    renderComponent();

    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() =>
      expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: "/signin" }),
    );
    expect(signOutMutationMock).toHaveBeenCalledWith({ locale: DEFAULT_LOCALE });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to revoke session",
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });
});
