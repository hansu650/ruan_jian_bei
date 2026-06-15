import { Clock, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/v2/status-pill";

interface LearningTaskCardProps {
  title: string;
  description: string;
  reason: string;
  minutes?: number | null;
  tags?: string[];
  href: string;
  actionLabel: string;
}

export function LearningTaskCard({
  title,
  description,
  reason,
  minutes,
  tags = [],
  href,
  actionLabel,
}: LearningTaskCardProps) {
  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <StatusPill tone="active">
            <Sparkles className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            今日学习任务
          </StatusPill>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
        </div>
        {minutes ? (
          <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:block">
            <Clock className="mb-1 h-4 w-4 text-sky-700" aria-hidden="true" />
            预计 {minutes} 分钟
          </div>
        ) : null}
      </div>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-950">推荐理由</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{reason}</p>
        {tags.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.slice(0, 5).map((tag) => (
              <StatusPill key={tag} tone="warning">
                {tag}
              </StatusPill>
            ))}
          </div>
        ) : null}
      </div>
      <Button asChild className="mt-5 bg-sky-700 hover:bg-sky-800">
        <Link href={href}>{actionLabel}</Link>
      </Button>
    </section>
  );
}
