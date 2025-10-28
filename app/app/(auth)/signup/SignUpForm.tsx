"use client";

import Input from "@tailadmin/components/form/input/InputField";
import Label from "@tailadmin/components/form/Label";
import Button from "@tailadmin/components/ui/button/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { AuthRequestError, register } from "@/src/lib/auth/api";

const emailRegex = /.+@.+\..+/;

type FieldErrors = Partial<Record<"name" | "email" | "password" | "confirmPassword", string>>;

export default function SignUpForm() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = useCallback((formData: FormData) => {
    const nextErrors: FieldErrors = {};
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!name) {
      nextErrors.name = "Name is required.";
    }

    if (!email) {
      nextErrors.email = "Email is required.";
    } else if (!emailRegex.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    } else if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password.";
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(nextErrors);

    return {
      isValid: Object.keys(nextErrors).length === 0,
      name,
      email,
      password,
    };
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);

      const formData = new FormData(event.currentTarget);
      const { isValid, name, email, password } = validate(formData);

      if (!isValid) {
        return;
      }

      try {
        setIsSubmitting(true);
        await register({
          name,
          email,
          password,
        });

        router.push("/signin?registered=1");
        router.refresh();
      } catch (err) {
        const message =
          err instanceof AuthRequestError
            ? err.message
            : "We couldn't create your account. Please try again.";
        setError(message);
        setIsSubmitting(false);
      }
    },
    [router, validate],
  );

  return (
    <div className="flex w-full flex-1 flex-col lg:w-1/2">
      <div className="mx-auto mb-5 w-full max-w-md sm:pt-10">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          &larr; Back to dashboard
        </Link>
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 text-title-sm font-semibold text-gray-800 dark:text-white/90 sm:text-title-md">
            Create an account
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tell us a bit about yourself to get started.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">
              Full name <span className="text-error-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="Jane Smith"
              error={Boolean(fieldErrors.name)}
              hint={fieldErrors.name}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="email">
              Email <span className="text-error-500">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              error={Boolean(fieldErrors.email)}
              hint={fieldErrors.email}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="password">
              Password <span className="text-error-500">*</span>
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Create a password"
              error={Boolean(fieldErrors.password)}
              hint={fieldErrors.password}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">
              Confirm password <span className="text-error-500">*</span>
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              error={Boolean(fieldErrors.confirmPassword)}
              hint={fieldErrors.confirmPassword}
              disabled={isSubmitting}
            />
          </div>
          {error ? (
            <div className="rounded-md border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-200">
              {error}
            </div>
          ) : null}
          <Button
            className="w-full"
            size="sm"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating your account..." : "Create account"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-gray-700 dark:text-gray-400">
          Already have an account?{" "}
          <Link href="/signin" className="text-brand-500 transition hover:text-brand-600 dark:text-brand-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
