import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/src/lib/auth/session";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  type SupportedLocale,
} from "@/src/lib/locale/constants";
import { normalizeLocale } from "@/src/lib/locale/utils";
import LandingPage from "@/src/app/(marketing)/LandingPage";
import { getLandingContent } from "@/src/services/marketing/landingContent";

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  const cookieStore = await cookies();
  const rawLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? DEFAULT_LOCALE;
  const locale: SupportedLocale = normalizeLocale(rawLocale);
  const content = getLandingContent(locale);

  return <LandingPage initialLocale={locale} initialContent={content} />;
}
