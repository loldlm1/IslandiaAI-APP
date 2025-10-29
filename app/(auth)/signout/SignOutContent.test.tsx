import { render, screen, waitFor } from "@testing-library/react";

import SignOutContent from "./SignOutContent";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

import { signOut as signOutMutation } from "@/src/lib/auth/api";
import { DEFAULT_LOCALE } from "@/src/lib/locale/constants";
import { LocaleProvider } from "@tailadmin/context/LocaleContext";

jest.mock("next-auth/react", () => ({
  signOut: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/src/lib/auth/api", () => {
  const actual = jest.requireActual("@/src/lib/auth/api");
  return {
    ...actual,
    signOut: jest.fn(),
  };
});

describe("SignOutContent", () => {
  const replace = jest.fn();
  const refresh = jest.fn();
  const useRouterMock = useRouter as jest.MockedFunction<typeof useRouter>;
  const signOutMock = signOut as jest.MockedFunction<typeof signOut>;
  const signOutMutationMock = signOutMutation as jest.MockedFunction<typeof signOutMutation>;

  beforeEach(() => {
    jest.clearAllMocks();
    useRouterMock.mockReturnValue({
      replace,
      refresh,
    } as unknown as ReturnType<typeof useRouter>);
  });

  function renderComponent() {
    return render(
      <LocaleProvider initialLocale={DEFAULT_LOCALE}>
        <SignOutContent />
      </LocaleProvider>,
    );
  }

  it("signs out successfully and redirects to sign in", async () => {
    signOutMutationMock.mockResolvedValue({ user: null, userErrors: [], setCookies: [] });
    signOutMock.mockResolvedValue(undefined as never);

    renderComponent();

    expect(
      screen.getByText("One moment while we securely end your session."),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(signOutMutationMock).toHaveBeenCalledWith({ locale: DEFAULT_LOCALE }),
    );
    await waitFor(() => expect(signOutMock).toHaveBeenCalledWith({ redirect: false }));

    await waitFor(() =>
      expect(
        screen.getByText("You have been signed out. Redirecting you to the sign-in page."),
      ).toBeInTheDocument(),
    );

    expect(replace).toHaveBeenCalledWith("/signin");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("shows an error message when sign out fails", async () => {
    signOutMutationMock.mockRejectedValue(new Error("Network error"));

    renderComponent();

    await waitFor(() => expect(screen.getByText("Network error")).toBeInTheDocument());

    expect(signOutMock).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("surfaces user error messages from the API", async () => {
    signOutMutationMock.mockResolvedValue({
      user: null,
      userErrors: [{ message: "Session could not be closed", path: [] }],
      setCookies: [],
    });

    renderComponent();

    await waitFor(() =>
      expect(screen.getByText("Session could not be closed")).toBeInTheDocument(),
    );

    expect(signOutMock).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });
});
