import { render, screen, waitFor } from "@testing-library/react";

import SignOutContent from "./SignOutContent";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

import { LocaleProvider } from "@tailadmin/context/LocaleContext";

import { DEFAULT_LOCALE } from "@/src/lib/locale/constants";

jest.mock("next-auth/react", () => ({
  signOut: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("SignOutContent", () => {
  const replace = jest.fn();
  const refresh = jest.fn();
  const useRouterMock = useRouter as jest.MockedFunction<typeof useRouter>;
  const signOutMock = signOut as jest.MockedFunction<typeof signOut>;

  beforeEach(() => {
    jest.clearAllMocks();
    useRouterMock.mockReturnValue({
      replace,
      refresh,
    } as unknown as ReturnType<typeof useRouter>);
    document.cookie = "";
  });

  function renderComponent() {
    return render(
      <LocaleProvider initialLocale={DEFAULT_LOCALE}>
        <SignOutContent />
      </LocaleProvider>,
    );
  }

  it("signs out successfully and redirects to sign in", async () => {
    signOutMock.mockResolvedValue({ url: "/signin" } as never);

    renderComponent();

    expect(
      screen.getByText("One moment while we securely end your session."),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: "/signin", redirect: false }),
    );

    await waitFor(() =>
      expect(
        screen.getByText("You have been signed out. Redirecting you to the sign-in page."),
      ).toBeInTheDocument(),
    );

    expect(replace).toHaveBeenCalledWith("/signin");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("redirects with a fallback error when sign out fails", async () => {
    signOutMock.mockRejectedValue(new Error("Network error"));

    renderComponent();

    await waitFor(() => expect(screen.getByText("Network error")).toBeInTheDocument());

    expect(replace).toHaveBeenCalledWith("/signin?error=SignOutFailed");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("appends an error query parameter when the backend reports a failure", async () => {
    signOutMock.mockImplementation(async () => {
      document.cookie = "islandia_signout_error=" + encodeURIComponent("Session could not be closed");
      return { url: "/signin" } as never;
    });

    renderComponent();

    await waitFor(() =>
      expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: "/signin", redirect: false }),
    );

    await waitFor(() =>
      expect(screen.getByText("Session could not be closed")).toBeInTheDocument(),
    );

    expect(replace).toHaveBeenCalledWith("/signin?error=SignOutFailed");
    expect(document.cookie).not.toContain("islandia_signout_error=");
  });
});
