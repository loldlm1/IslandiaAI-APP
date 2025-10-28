import type { ReactNode } from "react";

import { GridIcon, PlugInIcon } from "@tailadmin/icons";

export type SidebarNavItem = {
  name: string;
  icon: ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

export const mainNavigation: SidebarNavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/dashboard",
  },
];

export const secondaryNavigation: SidebarNavItem[] = [
  {
    icon: <PlugInIcon />,
    name: "Authentication",
    subItems: [
      { name: "Sign In", path: "/signin", pro: false },
      { name: "Sign Up", path: "/signup", pro: false },
    ],
  },
];

export function flattenNavigation(items: SidebarNavItem[]): {
  name: string;
  path: string;
}[] {
  return items.flatMap((item) => {
    if (item.subItems) {
      return item.subItems.map(({ name, path }) => ({ name, path }));
    }

    return item.path ? [{ name: item.name, path: item.path }] : [];
  });
}
