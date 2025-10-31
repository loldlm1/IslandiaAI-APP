import Image from "next/image";
import {
  ChartBarIcon,
  Cog6ToothIcon,
  DevicePhoneMobileIcon,
  LifebuoyIcon,
  MoonIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

import type { LandingBenefit } from "@/src/services/marketing/landingContent";

import { LandingContainer } from "./LandingContainer";

interface LandingBenefitsSectionProps {
  id: string;
  benefit: LandingBenefit;
  flip?: boolean;
}

const ICON_MAP = {
  insights: ChartBarIcon,
  acquisition: UserPlusIcon,
  retention: LifebuoyIcon,
  mobile: DevicePhoneMobileIcon,
  automation: Cog6ToothIcon,
  darkmode: MoonIcon,
} as const;

export function LandingBenefitsSection({ id, benefit, flip }: LandingBenefitsSectionProps) {
  return (
    <LandingContainer
      id={id}
      className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-24"
    >
      <div className={`flex-1 ${flip ? "lg:order-2" : ""}`}>
        <Image
          src={benefit.image.src}
          alt={benefit.image.alt}
          width={560}
          height={420}
          className="w-full rounded-3xl border border-zinc-200/60 shadow-xl dark:border-zinc-800/60"
        />
      </div>
      <div className={`flex-1 space-y-6 ${flip ? "lg:order-1" : ""}`}>
        <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white lg:text-4xl">
          {benefit.title}
        </h2>
        <p className="text-lg text-zinc-600 dark:text-zinc-300">{benefit.description}</p>
        <ul className="space-y-5">
          {benefit.bullets.map((bullet) => {
            const Icon = ICON_MAP[bullet.icon];
            return (
              <li key={bullet.title} className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    {bullet.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    {bullet.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </LandingContainer>
  );
}
