import Image from "next/image";
import Link from "next/link";

import type { LandingHeroContent } from "@/src/services/marketing/landingContent";

import { LandingContainer } from "./LandingContainer";

interface LandingHeroProps {
  hero: LandingHeroContent;
}

export function LandingHero({ hero }: LandingHeroProps) {
  return (
    <div className="bg-gradient-to-b from-white via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900">
      <LandingContainer className="flex flex-col items-start gap-16 lg:flex-row lg:items-center lg:gap-24">
        <div className="flex-1">
          <div className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:border-indigo-400/40 dark:bg-indigo-400/10 dark:text-indigo-300">
            {hero.eyebrow}
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-5xl lg:text-6xl">
            {hero.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-zinc-600 dark:text-zinc-300">
            {hero.description}
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href={hero.primaryAction.href}
              className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500"
            >
              {hero.primaryAction.label}
            </Link>
            <Link
              href={hero.secondaryAction.href}
              className="inline-flex items-center justify-center rounded-full border border-indigo-200 px-8 py-3 text-base font-semibold text-indigo-700 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-indigo-400/40 dark:text-indigo-300 dark:hover:border-indigo-400"
            >
              {hero.secondaryAction.label}
            </Link>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="relative w-full max-w-xl">
            <div className="absolute inset-0 rounded-2xl bg-indigo-200/50 blur-3xl dark:bg-indigo-500/20" />
            <Image
              src={hero.heroImage.src}
              alt={hero.heroImage.alt}
              width={616}
              height={617}
              priority
              className="relative z-10 w-full rounded-3xl border border-zinc-200/60 shadow-2xl shadow-indigo-900/10 dark:border-zinc-800/60"
            />
          </div>
        </div>
      </LandingContainer>

      <LandingContainer className="flex flex-col items-center gap-6 text-center">
        <span className="text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          {hero.trustedBy}
        </span>
        <div className="flex flex-wrap justify-center gap-8 opacity-80 grayscale dark:opacity-90">
          {hero.trustLogos.map((logo) => (
            <Image key={logo.name} src={logo.image} alt={logo.alt} width={120} height={40} />
          ))}
        </div>
      </LandingContainer>
    </div>
  );
}
