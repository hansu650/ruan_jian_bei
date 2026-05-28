import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

interface PageHeaderProps {
  title: string;
  description: string;
  phase?: string;
  badges?: ReactNode[];
  children?: ReactNode;
}

export function PageHeader({ title, description, phase, badges = [], children }: PageHeaderProps) {
  return (
    <section className="rounded-lg border bg-card p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {phase ? <Badge variant="warning">{phase}</Badge> : null}
            {badges.map((badge, index) => (
              <span key={index}>{badge}</span>
            ))}
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        {children ? <div className="shrink-0">{children}</div> : null}
      </div>
    </section>
  );
}
