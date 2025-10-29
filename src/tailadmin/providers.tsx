"use client";

import type { ReactNode } from "react";
import { LocaleProvider } from "./context/LocaleContext";
import { SidebarProvider } from "./context/SidebarContext";
import { ThemeProvider } from "./context/ThemeContext";

interface TailAdminProvidersProps {
  children: ReactNode;
  initialLocale?: string | null;
}

export function TailAdminProviders({ children, initialLocale }: TailAdminProvidersProps) {
  return (
    <LocaleProvider initialLocale={initialLocale}>
      <ThemeProvider>
        <SidebarProvider>{children}</SidebarProvider>
      </ThemeProvider>
    </LocaleProvider>
  );
}
