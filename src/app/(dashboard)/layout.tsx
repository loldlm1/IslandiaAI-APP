import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/src/lib/auth/session";

import { DashboardAppShell } from "./DashboardAppShell";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  return <DashboardAppShell session={session}>{children}</DashboardAppShell>;
}
