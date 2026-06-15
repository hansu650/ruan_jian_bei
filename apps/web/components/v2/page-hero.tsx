import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
}

export function PageHero({ eyebrow, title, description, actions, aside, className }: PageHeroProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8",
        className,
      )}
    >
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
        <div>
          {eyebrow ? (
            <p className="text-sm font-medium text-sky-700">{eyebrow}</p>
          ) : null}
          <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{description}</p>
          {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {aside ? <div>{aside}</div> : null}
      </div>
    </section>
  );
}
