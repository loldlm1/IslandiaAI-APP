import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import SignUpForm from "./SignUpForm";

import { AuthRequestError, register } from "@/src/lib/auth/api";
import { useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/src/lib/auth/api", () => {
  const actual = jest.requireActual("@/src/lib/auth/api");
  return {
    ...actual,
    register: jest.fn(),
  };
});

describe("SignUpForm", () => {
  const push = jest.fn();
  const refresh = jest.fn();
  const useRouterMock = useRouter as jest.MockedFunction<typeof useRouter>;
  const registerMock = register as jest.MockedFunction<typeof register>;

  beforeEach(() => {
    jest.clearAllMocks();
    useRouterMock.mockReturnValue({
      push,
      refresh,
    } as unknown as ReturnType<typeof useRouter>);
  });

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
    render(<SignUpForm />);

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText("Name is required.")).toBeInTheDocument();
    expect(await screen.findByText("Email is required.")).toBeInTheDocument();
    expect(
      await screen.findByText("Password is required."),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Confirm your password."),
    ).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("submits registration details and redirects to sign in", async () => {
    registerMock.mockResolvedValueOnce({
      user: {
        id: "user_124",
        email: "new@example.com",
        name: "Jane Doe",
      },
    });

    render(<SignUpForm />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(registerMock).toHaveBeenCalledWith({
        name: "Jane Doe",
        email: "new@example.com",
        password: "password123",
      }),
    );

    expect(push).toHaveBeenCalledWith("/signin?registered=1");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("surfaces API errors returned from registration", async () => {
    registerMock.mockRejectedValueOnce(
      new AuthRequestError("Email already registered"),
    );

    render(<SignUpForm />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText("Email already registered"),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
