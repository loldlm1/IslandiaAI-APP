"use client";

import type { ReactNode } from "react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import { useSidebar } from "@tailadmin/context/SidebarContext";
import AppHeader from "@tailadmin/layouts/AppHeader";
import AppSidebar from "@tailadmin/layouts/AppSidebar";
import Backdrop from "@tailadmin/layouts/Backdrop";

import DashboardBreadcrumb from "./DashboardBreadcrumb";
import {
  mainNavigation,
  secondaryNavigation,
} from "@/src/tailadmin/layouts/navigation";

interface DashboardAppShellProps {
  session: Session;
  children: ReactNode;
}

export function DashboardAppShell({
  session,
  children,
}: DashboardAppShellProps) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen xl:flex">
        <AppSidebar
          mainItems={mainNavigation}
          secondaryItems={secondaryNavigation}
        />
        <Backdrop />
        <div
          className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
        >
          <AppHeader />
          <div className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
            <DashboardBreadcrumb />
            {children}
          </div>
        </div>
      </div>
    </SessionProvider>
  );
}
