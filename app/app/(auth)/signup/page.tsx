import SignUpForm from "@tailadmin/components/auth/SignUpForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up | TailAdmin",
  description: "TailAdmin authentication sign-up page",
};

export default function SignUpPage() {
  return <SignUpForm />;
}
