import type { LandingVideoContent } from "@/src/services/marketing/landingContent";

import { LandingContainer } from "./LandingContainer";

interface LandingVideoSectionProps {
  id: string;
  video: LandingVideoContent;
}

export function LandingVideoSection({ id, video }: LandingVideoSectionProps) {
  return (
    <LandingContainer id={id} className="text-center">
      <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white lg:text-4xl">
        {video.title}
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-300">
        {video.description}
      </p>
      <div className="relative mx-auto mt-10 h-0 max-w-4xl overflow-hidden rounded-3xl border border-zinc-200/60 pt-[56.25%] shadow-xl dark:border-zinc-800/60">
        <iframe
          title={video.title}
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/${video.videoId}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </LandingContainer>
  );
}
