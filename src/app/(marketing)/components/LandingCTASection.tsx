import Link from "next/link";

import type { LandingCtaContent } from "@/src/services/marketing/landingContent";

import { LandingContainer } from "./LandingContainer";

interface LandingCTASectionProps {
  id: string;
  cta: LandingCtaContent;
}

export function LandingCTASection({ id, cta }: LandingCTASectionProps) {
  return (
    <LandingContainer
      id={id}
      className="rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 px-8 py-20 text-center text-white shadow-2xl shadow-indigo-900/30"
    >
      <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{cta.title}</h2>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-indigo-100">{cta.description}</p>
      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href={cta.primaryAction.href}
          className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-base font-semibold text-indigo-600 shadow-md shadow-indigo-900/20 transition hover:scale-[1.01]"
        >
          {cta.primaryAction.label}
        </Link>
        {cta.secondaryAction ? (
          <Link
            href={cta.secondaryAction.href}
            className="inline-flex items-center justify-center rounded-full border border-white/70 px-8 py-3 text-base font-semibold text-white transition hover:bg-white/10"
          >
            {cta.secondaryAction.label}
          </Link>
        ) : null}
      </div>
    </LandingContainer>
  );
}
