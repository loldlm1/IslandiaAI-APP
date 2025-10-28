"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

import PageBreadcrumb from "@tailadmin/components/common/PageBreadCrumb";
import {
  flattenNavigation,
  mainNavigation,
  secondaryNavigation,
} from "@/src/tailadmin/layouts/navigation";

const fallbackTitle = "Dashboard";

export default function DashboardBreadcrumb() {
  const pathname = usePathname();

  const navLookup = useMemo(() => {
    const entries = [
      ...flattenNavigation(mainNavigation),
      ...flattenNavigation(secondaryNavigation),
    ];

    return new Map(entries.map(({ name, path }) => [path, name]));
  }, []);

  const pageTitle = navLookup.get(pathname) ?? fallbackTitle;

  return <PageBreadcrumb pageTitle={pageTitle} />;
}
