import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import SignInForm from "./SignInForm";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe("SignInForm", () => {
  const push = jest.fn();
  const refresh = jest.fn();
  const useRouterMock = useRouter as jest.MockedFunction<typeof useRouter>;
  const useSearchParamsMock =
    useSearchParams as jest.MockedFunction<typeof useSearchParams>;
  const signInMock = signIn as jest.MockedFunction<typeof signIn>;

  beforeEach(() => {
    jest.clearAllMocks();
    useRouterMock.mockReturnValue({
      push,
      refresh,
    } as unknown as ReturnType<typeof useRouter>);
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
  });

  it("shows validation errors for missing fields", async () => {
    render(<SignInForm />);

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Email is required.")).toBeInTheDocument();
    expect(
      await screen.findByText("Password is required."),
    ).toBeInTheDocument();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("calls signIn with credentials and redirects on success", async () => {
    const callbackUrl = "/reports";
    useSearchParamsMock.mockReturnValue(
      new URLSearchParams(`callbackUrl=${encodeURIComponent(callbackUrl)}`),
    );
    signInMock.mockResolvedValueOnce({
      error: null,
      url: callbackUrl,
    });

    render(<SignInForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(signInMock).toHaveBeenCalledWith("credentials", {
        redirect: false,
        email: "user@example.com",
        password: "password123",
        callbackUrl,
      }),
    );

    expect(push).toHaveBeenCalledWith(callbackUrl);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("maps authentication errors to user-friendly messages", async () => {
    signInMock.mockResolvedValueOnce({
      error: "CredentialsSignin",
    });

    render(<SignInForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText(
        "Invalid email or password. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
