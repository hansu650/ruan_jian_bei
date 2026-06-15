import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/v2/status-pill";

interface LearningStepCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  status: "done" | "active" | "todo";
  actionLabel: string;
}

const statusText = {
  done: "已完成",
  active: "可继续",
  todo: "未开始",
};

export function LearningStepCard({
  title,
  description,
  href,
  icon: Icon,
  status,
  actionLabel,
}: LearningStepCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <StatusPill tone={status === "done" ? "success" : status === "active" ? "warning" : "default"}>
          {statusText[status]}
        </StatusPill>
      </div>
      <h3 className="mt-4 font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{description}</p>
      <Button asChild variant={status === "active" ? "default" : "outline"} size="sm" className="mt-4">
        <Link href={href}>{actionLabel}</Link>
      </Button>
    </div>
  );
}
