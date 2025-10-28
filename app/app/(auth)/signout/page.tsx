import type { Metadata } from "next";

import SignOutContent from "./SignOutContent";

export const metadata: Metadata = {
  title: "Sign out | TailAdmin",
  description: "Signing out of TailAdmin",
};

export default function SignOutPage() {
  return <SignOutContent />;
}
