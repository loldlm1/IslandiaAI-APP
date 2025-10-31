"use client";

import { useMemo } from "react";

import { useLocale } from "@tailadmin/context/LocaleContext";
import type { SupportedLocale } from "@/src/lib/locale/constants";
import { getLandingContent, type LandingPageContent } from "@/src/services/marketing/landingContent";

import { LandingCTASection } from "./components/LandingCTASection";
import { LandingBenefitsSection } from "./components/LandingBenefitsSection";
import { LandingFaqSection } from "./components/LandingFaqSection";
import { LandingFooter } from "./components/LandingFooter";
import { LandingHero } from "./components/LandingHero";
import { LandingNavbar } from "./components/LandingNavbar";
import { LandingTestimonialsSection } from "./components/LandingTestimonialsSection";
import { LandingVideoSection } from "./components/LandingVideoSection";

interface LandingPageClientProps {
  initialLocale: SupportedLocale;
  initialContent: LandingPageContent;
}

export default function LandingPageClient({
  initialLocale,
  initialContent,
}: LandingPageClientProps) {
  const { locale } = useLocale();

  const content = useMemo(() => {
    if (locale === initialLocale) {
      return initialContent;
    }

    return getLandingContent(locale);
  }, [initialContent, initialLocale, locale]);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <LandingNavbar nav={content.nav} />
      <main>
        <LandingHero hero={content.hero} />
        {content.benefits.map((benefit, index) => (
          <LandingBenefitsSection
            id={index === 0 ? "features" : "automation"}
            key={benefit.title}
            benefit={benefit}
            flip={index % 2 === 1}
          />
        ))}
        <LandingVideoSection id="product-tour" video={content.video} />
        <LandingTestimonialsSection id="testimonials" testimonials={content.testimonials} />
        <LandingFaqSection id="faq" faq={content.faq} />
        <LandingCTASection id="cta" cta={content.cta} />
      </main>
      <LandingFooter footer={content.footer} />
    </div>
  );
}
