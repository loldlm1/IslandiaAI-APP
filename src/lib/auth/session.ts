import { headers } from "next/headers";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth";

import { fetchViewer } from "./api";
import { authOptions } from "./nextAuthOptions";
import { parseLocaleFromCookieHeader } from "@/src/lib/locale/utils";

export async function auth(): Promise<Session | null> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }

  try {
    const cookieHeader = headers().get("cookie");
    const locale = parseLocaleFromCookieHeader(cookieHeader);
    const viewer = await fetchViewer({
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      locale,
    });

    if (!viewer) {
      return null;
    }

    return {
      ...session,
      user: {
        ...session.user,
        id: viewer.id,
        email: viewer.email,
        name: viewer.name,
      },
    } as Session;
  } catch (error) {
    console.error("Failed to load viewer from session", error);
    return null;
  }
}
