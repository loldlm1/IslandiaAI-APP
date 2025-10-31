import type { SupportedLocale } from "@/src/lib/locale/constants";
import type { LandingPageContent } from "@/src/services/marketing/landingContent";

import LandingPageClient from "./LandingPageClient";

interface LandingPageProps {
  initialLocale: SupportedLocale;
  initialContent: LandingPageContent;
}

export default function LandingPage(props: LandingPageProps) {
  return <LandingPageClient {...props} />;
}

