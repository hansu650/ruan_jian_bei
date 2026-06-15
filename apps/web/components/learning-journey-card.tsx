import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";

interface LearningJourneyCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  status: "done" | "active" | "todo";
  actionLabel: string;
}

export function LearningJourneyCard({
  title,
  description,
  href,
  icon: Icon,
  status,
  actionLabel,
}: LearningJourneyCardProps) {
  return (
    <Card className="border-slate-200 bg-white transition hover:border-sky-200 hover:shadow-md">
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sky-700">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <StatusBadge status={status} />
        </div>
        <div className="min-h-0 flex-1">
          <h3 className="font-semibold text-slate-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <Button asChild variant={status === "active" ? "default" : "outline"} size="sm">
          <Link href={href}>{actionLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
