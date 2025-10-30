"use client";

import Checkbox from "@tailadmin/components/form/input/Checkbox";
import Input from "@tailadmin/components/form/input/InputField";
import Label from "@tailadmin/components/form/Label";
import Button from "@tailadmin/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@tailadmin/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { startTransition, useCallback, useEffect, useState } from "react";

const emailRegex = /.+@.+\..+/;

type FieldErrors = Partial<Record<"email" | "password", string>>;

function mapError(code: string | null): string | null {
  if (!code) return null;

  switch (code) {
    case "CredentialsSignin":
      return "Invalid email or password. Please try again.";
    case "AccessDenied":
      return "Access denied. Contact an administrator for help.";
    default:
      return code.replace(/_/g, " ");
  }
}

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  useEffect(() => {
    const nextError = mapError(searchParams.get("error"));
    const nextSuccess = searchParams.get("registered")
      ? "Registration successful. Sign in to continue."
      : null;

    startTransition(() => {
      setError(nextError);
      setSuccess(nextSuccess);
    });
  }, [searchParams]);

  const validate = useCallback((email: string, password: string) => {
    const validationErrors: FieldErrors = {};

    if (!email.trim()) {
      validationErrors.email = "Email is required.";
    } else if (!emailRegex.test(email)) {
      validationErrors.email = "Enter a valid email address.";
    }

    if (!password.trim()) {
      validationErrors.password = "Password is required.";
    } else if (password.length < 8) {
      validationErrors.password = "Password must be at least 8 characters.";
    }

    setFieldErrors(validationErrors);

    return Object.keys(validationErrors).length === 0;
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);

      const formData = new FormData(event.currentTarget);
      const email = String(formData.get("email") ?? "");
      const password = String(formData.get("password") ?? "");

      if (!validate(email, password)) {
        return;
      }

      try {
        setIsSubmitting(true);
        const result = await signIn("credentials", {
          redirect: false,
          email,
          password,
          callbackUrl,
        });

        if (result?.error) {
          setError(mapError(result.error));
          setIsSubmitting(false);
          return;
        }

        let redirectUrl = result?.url ?? callbackUrl;
        if (redirectUrl) {
          try {
            const url = new URL(redirectUrl, window.location.origin);
            redirectUrl = url.pathname + url.search + url.hash;
          } catch {
            if (redirectUrl.startsWith("/")) {
              redirectUrl = redirectUrl;
            } else {
              redirectUrl = callbackUrl;
            }
          }
        } else {
          redirectUrl = callbackUrl;
        }

        router.push(redirectUrl);
        router.refresh();
      } catch {
        setError("Something went wrong while signing you in. Please try again.");
        setIsSubmitting(false);
      }
    },
    [callbackUrl, router, validate],
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
            Sign in
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter your email and password to continue.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email">
              Email <span className="text-error-500">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              error={Boolean(fieldErrors.email)}
              hint={fieldErrors.email}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="password">
              Password <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                error={Boolean(fieldErrors.password)}
                hint={fieldErrors.password}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeIcon className="h-5 w-5" /> : <EyeCloseIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-3 text-theme-sm text-gray-700 dark:text-gray-400">
              <Checkbox checked={rememberMe} onChange={setRememberMe} />
              Keep me signed in
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-brand-500 transition hover:text-brand-600 dark:text-brand-400"
            >
              Forgot password?
            </Link>
          </div>
          {error ? (
            <div className="rounded-md border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-200">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="rounded-md border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-400/40 dark:bg-success-500/10 dark:text-success-200">
              {success}
            </div>
          ) : null}
          <Button
            className="w-full"
            size="sm"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-gray-700 dark:text-gray-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-brand-500 transition hover:text-brand-600 dark:text-brand-400">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
