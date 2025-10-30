"use client";

import Button from "@tailadmin/components/ui/button/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

import {
  SIGN_OUT_ERROR_CODE,
  SIGN_OUT_ERROR_COOKIE_NAME,
} from "@/src/lib/auth/constants";
import { useLocale } from "@tailadmin/context/LocaleContext";

type SignOutState = "loading" | "success" | "error";

function readSignOutErrorCookie(): string | null {
  const cookieEntry = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${SIGN_OUT_ERROR_COOKIE_NAME}=`));

  if (!cookieEntry) {
    return null;
  }

  const [, rawValue] = cookieEntry.split("=");
  if (!rawValue) {
    return null;
  }

  try {
    return decodeURIComponent(rawValue);
  } catch {
    return rawValue;
  }
}

function clearSignOutErrorCookie() {
  document.cookie = `${SIGN_OUT_ERROR_COOKIE_NAME}=; path=/; max-age=0`;
}

function appendErrorQuery(url: string): string {
  if (!url) {
    return `/signin?error=${encodeURIComponent(SIGN_OUT_ERROR_CODE)}`;
  }

  const [base, hash] = url.split("#", 2);
  const separator = base.includes("?")
    ? base.endsWith("?") || base.endsWith("&")
      ? ""
      : "&"
    : "?";
  const next = `${base}${separator}error=${encodeURIComponent(SIGN_OUT_ERROR_CODE)}`;

  return hash ? `${next}#${hash}` : next;
}

function buildRedirectUrl(rawUrl: string | undefined, includeError: boolean): string {
  const fallbackUrl = "/signin";

  if (!rawUrl) {
    return includeError ? appendErrorQuery(fallbackUrl) : fallbackUrl;
  }

  try {
    const parsed = new URL(rawUrl, window.location.origin);

    if (!parsed.pathname.startsWith("/")) {
      parsed.pathname = fallbackUrl;
    }

    if (includeError) {
      parsed.searchParams.set("error", SIGN_OUT_ERROR_CODE);
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    if (!rawUrl.startsWith("/")) {
      return includeError ? appendErrorQuery(fallbackUrl) : fallbackUrl;
    }

    return includeError ? appendErrorQuery(rawUrl) : rawUrl;
  }
}

function formatErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return "We couldn't complete your sign out. Please try again.";
}

export default function SignOutContent() {
  const router = useRouter();
  const [state, setState] = useState<SignOutState>("loading");
  const [error, setError] = useState<string | null>(null);
  const { locale } = useLocale();

  useEffect(() => {
    let isMounted = true;

    const performSignOut = async () => {
      try {
        const result = await signOut({ callbackUrl: "/signin", redirect: false });

        const signOutError = readSignOutErrorCookie();
        clearSignOutErrorCookie();

        if (!isMounted) return;

        const redirectUrl = buildRedirectUrl(result?.url, Boolean(signOutError));

        setState(signOutError ? "error" : "success");
        if (signOutError) {
          setError(signOutError);
        }
        router.replace(redirectUrl);
        router.refresh();
      } catch (error) {
        if (!isMounted) return;
        const message = formatErrorMessage(error);
        clearSignOutErrorCookie();
        setState("error");
        setError(message);
        router.replace(`/signin?error=${encodeURIComponent(SIGN_OUT_ERROR_CODE)}`);
        router.refresh();
      }
    };

    void performSignOut();

    return () => {
      isMounted = false;
    };
  }, [locale, router]);

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center lg:w-1/2">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
          Signing out
        </h1>
        {state === "loading" ? (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            One moment while we securely end your session.
          </p>
        ) : null}
        {state === "success" ? (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            You have been signed out. Redirecting you to the sign-in page.
          </p>
        ) : null}
        {state === "error" ? (
          <div className="mt-3 space-y-4">
            <p className="text-sm text-error-600 dark:text-error-300">{error}</p>
            <div className="flex items-center justify-center gap-3">
              <Button
                type="button"
                size="sm"
                onClick={() => router.replace("/signin")}
              >
                Go to sign in
              </Button>
              <Link
                href="/dashboard"
                className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Return home
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
