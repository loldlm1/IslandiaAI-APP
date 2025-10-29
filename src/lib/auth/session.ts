import { headers } from "next/headers";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth";

import { AuthRequestError, fetchViewer } from "./api";
import { authOptions } from "./nextAuthOptions";
import { parseLocaleFromCookieHeader } from "@/src/lib/locale/utils";

export async function auth(): Promise<Session | null> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }

  try {
    const headerStore = await headers();
    const cookieHeader = headerStore.get("cookie");
    const locale = parseLocaleFromCookieHeader(cookieHeader);
    const viewer = await fetchViewer({
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      locale: locale as string,
    });

    if (!viewer) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Viewer query returned null - session may be invalid");
      }
      return session;
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
    if (error instanceof AuthRequestError) {
      if (error.status === 401 || error.status === 403) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Viewer query returned unauthorized - session may be expired", error.message);
        }
        return null;
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.error("Failed to load viewer from session", error);
    }

    return session;
  }
}
