import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/src/lib/auth/session";

import SignUpForm from "./SignUpForm";

export const metadata: Metadata = {
  title: "Sign up | TailAdmin",
  description: "TailAdmin authentication sign-up page",
};

export default async function SignUpPage() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return <SignUpForm />;
}
