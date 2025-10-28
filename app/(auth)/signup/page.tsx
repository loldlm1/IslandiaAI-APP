import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/src/lib/auth/nextAuthOptions";

import SignUpForm from "./SignUpForm";

export const metadata: Metadata = {
  title: "Sign up | TailAdmin",
  description: "TailAdmin authentication sign-up page",
};

export default async function SignUpPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return <SignUpForm />;
}
