"use client";

import Button from "@tailadmin/components/ui/button/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

import { logout } from "@/src/lib/auth/api";

type SignOutState = "loading" | "success" | "error";

export default function SignOutContent() {
  const router = useRouter();
  const [state, setState] = useState<SignOutState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const performSignOut = async () => {
      try {
        const session = await getSession();
        if (session?.accessToken) {
          await logout({ accessToken: session.accessToken });
        }

        await signOut({ redirect: false });

        if (!isMounted) return;

        setState("success");
        router.replace("/signin");
        router.refresh();
      } catch (err) {
        if (!isMounted) return;
        setState("error");
        setError("We couldn't complete your sign out. Please try again.");
      }
    };

    void performSignOut();

    return () => {
      isMounted = false;
    };
  }, [router]);

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
