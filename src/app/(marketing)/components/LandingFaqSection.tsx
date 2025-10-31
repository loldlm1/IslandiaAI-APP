"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

import type { LandingFaqItem } from "@/src/services/marketing/landingContent";

import { LandingContainer } from "./LandingContainer";

interface LandingFaqSectionProps {
  id: string;
  faq: LandingFaqItem[];
}

export function LandingFaqSection({ id, faq }: LandingFaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <LandingContainer id={id} className="max-w-3xl">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white lg:text-4xl">
          Frequently asked questions
        </h2>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
          Everything you need to know about getting started with IslandiaAI.
        </p>
      </div>
      <div className="space-y-3">
        {faq.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              key={item.question}
              className="rounded-2xl border border-zinc-200/60 bg-white/90 p-6 dark:border-zinc-800/60 dark:bg-zinc-900/70"
            >
              <button
                type="button"
                className="flex w-full items-center justify-between text-left text-lg font-semibold text-zinc-900 dark:text-white"
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <span>{item.question}</span>
                <ChevronDownIcon
                  className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {isOpen ? (
                <p className="mt-3 text-base text-zinc-600 dark:text-zinc-300">{item.answer}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </LandingContainer>
  );
}

