import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/src/lib/auth/session";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  type SupportedLocale,
} from "@/src/lib/locale/constants";
import { normalizeLocale } from "@/src/lib/locale/utils";
import LandingPage from "@/src/app/(marketing)/LandingPage";
import { getLandingContent } from "@/src/services/marketing/landingContent";

async function getLocaleFromCookies(): Promise<SupportedLocale> {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? DEFAULT_LOCALE;
  return normalizeLocale(rawLocale);
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromCookies();
  const content = getLandingContent(locale);

  return {
    title: content.meta.title,
    description: content.meta.description,
  };
}

export default async function Home() {
  try {
    const session = await auth();

    if (session) {
      redirect("/dashboard");
    }

    const locale = await getLocaleFromCookies();
    const content = getLandingContent(locale);

    return <LandingPage initialLocale={locale} initialContent={content} />;
  } catch (error) {
    // Fallback to default locale if there's any error
    const locale = await getLocaleFromCookies();
    const content = getLandingContent(locale);
    
    console.error("Error rendering landing page:", error);
    
    return <LandingPage initialLocale={locale} initialContent={content} />;
  }
}
