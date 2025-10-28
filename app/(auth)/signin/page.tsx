import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/src/lib/auth/session";

import SignInForm from "./SignInForm";

export const metadata: Metadata = {
  title: "Sign in | TailAdmin",
  description: "TailAdmin authentication sign-in page",
};

export default async function SignInPage() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return <SignInForm />;
}
