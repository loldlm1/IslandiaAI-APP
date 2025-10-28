import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/src/lib/auth/nextAuthOptions";

import SignInForm from "./SignInForm";

export const metadata: Metadata = {
  title: "Sign in | TailAdmin",
  description: "TailAdmin authentication sign-in page",
};

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return <SignInForm />;
}
