import SignInForm from "@tailadmin/components/auth/SignInForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in | TailAdmin",
  description: "TailAdmin authentication sign-in page",
};

export default function SignInPage() {
  return <SignInForm />;
}
