import type { PropsWithChildren } from "react";
import { twJoin } from "tailwind-merge";

interface LandingContainerProps {
  id?: string;
  className?: string;
}

export function LandingContainer({
  id,
  className,
  children,
}: PropsWithChildren<LandingContainerProps>) {
  return (
    <section
      id={id}
      className={twJoin(
        "container mx-auto px-6 py-16 md:px-8 lg:px-12 xl:px-0",
        className,
      )}
    >
      {children}
    </section>
  );
}
