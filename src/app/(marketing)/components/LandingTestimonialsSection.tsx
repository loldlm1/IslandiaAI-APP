import Image from "next/image";

import type { LandingTestimonial } from "@/src/services/marketing/landingContent";

import { LandingContainer } from "./LandingContainer";

interface LandingTestimonialsSectionProps {
  id: string;
  testimonials: LandingTestimonial[];
}

export function LandingTestimonialsSection({
  id,
  testimonials,
}: LandingTestimonialsSectionProps) {
  return (
    <LandingContainer id={id}>
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white lg:text-4xl">
          Customers move faster with IslandiaAI
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-300">
          {testimonialsSubheading}
        </p>
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <article
            key={testimonial.name}
            className={`flex h-full flex-col justify-between rounded-3xl border border-zinc-200/60 bg-white/90 p-10 shadow-lg shadow-indigo-900/5 transition hover:-translate-y-1 hover:shadow-indigo-900/10 dark:border-zinc-800/60 dark:bg-zinc-900/70 ${
              index === 0 ? "lg:col-span-2" : ""
            }`}
          >
            <p className="text-xl leading-relaxed text-zinc-800 dark:text-zinc-100">
              {renderHighlightedQuote(testimonial.quote, testimonial.highlight)}
            </p>
            <div className="mt-8 flex items-center gap-4">
              <div className="h-14 w-14 overflow-hidden rounded-full">
                <Image
                  src={testimonial.avatar.src}
                  alt={testimonial.avatar.alt}
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="text-base font-semibold text-zinc-900 dark:text-white">
                  {testimonial.name}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{testimonial.role}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </LandingContainer>
  );
}

const testimonialsSubheading =
  "Teams orchestrate suppliers, invoices, and operations in a single workspace built for revenue velocity.";
function renderHighlightedQuote(quote: string, highlight: string) {
  if (!highlight) {
    return quote;
  }

  const index = quote.indexOf(highlight);

  if (index === -1) {
    return quote;
  }

  const before = quote.slice(0, index);
  const after = quote.slice(index + highlight.length);

  return (
    <>
      {before}
      <mark className="rounded-md bg-indigo-100 px-1 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200">
        {highlight}
      </mark>
      {after}
    </>
  );
}
