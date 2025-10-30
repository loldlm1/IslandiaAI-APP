import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import SignUpForm from "./SignUpForm";

import { AuthRequestError, signUp } from "@/src/lib/auth/api";
import { useRouter } from "next/navigation";
import { DEFAULT_LOCALE } from "@/src/lib/locale/constants";
import { LocaleProvider } from "@tailadmin/context/LocaleContext";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/src/lib/auth/api", () => {
  const actual = jest.requireActual("@/src/lib/auth/api");
  return {
    ...actual,
    signUp: jest.fn(),
  };
});

describe("SignUpForm", () => {
  const push = jest.fn();
  const refresh = jest.fn();
  const useRouterMock = useRouter as jest.MockedFunction<typeof useRouter>;
  const signUpMock = signUp as jest.MockedFunction<typeof signUp>;

  beforeEach(() => {
    jest.clearAllMocks();
    useRouterMock.mockReturnValue({
      push,
      refresh,
    } as unknown as ReturnType<typeof useRouter>);
  });

  function renderForm() {
    return render(
      <LocaleProvider initialLocale={DEFAULT_LOCALE}>
        <SignUpForm />
      </LocaleProvider>,
    );
  }

  function fillRequiredFields() {
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(screen.getByLabelText(/^email/i), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "password123" },
    });
  }

  it("shows validation errors for missing values", async () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText("Name is required.")).toBeInTheDocument();
    expect(await screen.findByText("Email is required.")).toBeInTheDocument();
    expect(
      await screen.findByText("Password is required."),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Confirm your password."),
    ).toBeInTheDocument();
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("submits registration details and redirects to sign in", async () => {
    signUpMock.mockResolvedValueOnce({
      user: {
        id: "user_124",
        email: "new@example.com",
        name: "Jane Doe",
      },
      userErrors: [],
    });

    renderForm();
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(signUpMock).toHaveBeenCalledWith(
        {
          name: "Jane Doe",
          email: "new@example.com",
          password: "password123",
          passwordConfirmation: "password123",
        },
        { locale: DEFAULT_LOCALE },
      ),
    );

    expect(push).toHaveBeenCalledWith("/signin?registered=1");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("surfaces API errors returned from registration", async () => {
    signUpMock.mockRejectedValueOnce(
      new AuthRequestError("Email already registered"),
    );

    renderForm();
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText("Email already registered"),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("does not emit hydration warnings when password managers adjust autocomplete", () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      const serverHTML = renderToString(
        <LocaleProvider initialLocale={DEFAULT_LOCALE}>
          <SignUpForm />
        </LocaleProvider>,
      );

      const container = document.createElement("div");
      container.innerHTML = serverHTML;

      const enforceAutocomplete = (name: string, value: string) => {
        const input = container.querySelector<HTMLInputElement>(
          `input[name="${name}"]`,
        );
        if (input) {
          input.setAttribute("autocomplete", value);
        }
      };

      enforceAutocomplete("name", "name");
      enforceAutocomplete("email", "email");
      enforceAutocomplete("password", "new-password");
      enforceAutocomplete("confirmPassword", "new-password");

      let root: ReturnType<typeof hydrateRoot> | undefined;

      act(() => {
        root = hydrateRoot(
          container,
          <LocaleProvider initialLocale={DEFAULT_LOCALE}>
            <SignUpForm />
          </LocaleProvider>,
        );
      });

      act(() => {
        root?.unmount();
      });

      const hydrationWarnings = consoleErrorSpy.mock.calls.filter((call) =>
        call.some(
          (message) =>
            typeof message === "string" && message.includes("did not match"),
        ),
      );

      expect(hydrationWarnings).toHaveLength(0);
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
