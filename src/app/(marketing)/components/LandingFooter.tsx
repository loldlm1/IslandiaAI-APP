"use client";

import Link from "next/link";

import type { LandingFooterContent } from "@/src/services/marketing/landingContent";

import { LandingContainer } from "./LandingContainer";

interface LandingFooterProps {
  footer: LandingFooterContent;
}

export function LandingFooter({ footer }: LandingFooterProps) {
  return (
    <footer className="border-t border-zinc-200/60 bg-white dark:border-zinc-800/60 dark:bg-zinc-950">
      <LandingContainer className="flex flex-col items-center justify-between gap-6 text-sm text-zinc-600 dark:text-zinc-400 md:flex-row">
        <span>{footer.copyright}</span>
        <nav className="flex flex-wrap items-center justify-center gap-6">
          {footer.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </LandingContainer>
    </footer>
  );
}

