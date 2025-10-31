"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

import { LocaleSwitcher } from "@tailadmin/components/common/LocaleSwitcher";
import type { LandingPageContent } from "@/src/services/marketing/landingContent";

interface LandingNavbarProps {
  nav: LandingPageContent["nav"];
}

export function LandingNavbar({ nav }: LandingNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/50 bg-white/80 backdrop-blur dark:border-zinc-800/60 dark:bg-zinc-950/70">
      <div className="container mx-auto flex items-center justify-between gap-4 px-6 py-4 md:px-8 lg:px-12 xl:px-0">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={nav.logo.src}
            alt={nav.logo.alt}
            width={36}
            height={36}
            priority
          />
          <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            IslandiaAI
          </span>
        </Link>

        <nav className="hidden items-center gap-10 text-sm font-medium text-zinc-700 dark:text-zinc-300 md:flex">
          {nav.links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-indigo-600 dark:hover:text-indigo-400">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <LocaleSwitcher />
          <Link
            href={nav.cta.href}
            className="rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500"
          >
            {nav.cta.label}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="rounded-full p-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900 md:hidden"
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-zinc-200/50 bg-white py-4 dark:border-zinc-800/60 dark:bg-zinc-950 md:hidden">
          <div className="container mx-auto flex flex-col gap-3 px-6 md:px-8 lg:px-12 xl:px-0">
            {nav.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-base font-medium text-zinc-700 hover:text-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <LocaleSwitcher />
            <Link
              href={nav.cta.href}
              className="rounded-full bg-indigo-600 px-6 py-2 text-center text-base font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500"
              onClick={() => setMobileOpen(false)}
            >
              {nav.cta.label}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

