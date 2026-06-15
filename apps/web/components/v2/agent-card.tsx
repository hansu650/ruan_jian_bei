import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/v2/status-pill";

interface AgentCardProps {
  name: string;
  title: string;
  role: string;
  input: string;
  output: string;
  data: string;
  next: string;
  href: string;
  icon: LucideIcon;
}

export function AgentCard({ name, title, role, input, output, data, next, href, icon: Icon }: AgentCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <StatusPill tone="active">{name}</StatusPill>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{role}</p>
      <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
        <p><span className="font-medium text-slate-900">输入：</span>{input}</p>
        <p><span className="font-medium text-slate-900">输出：</span>{output}</p>
        <p><span className="font-medium text-slate-900">数据：</span>{data}</p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500">下一步：{next}</span>
        <Button asChild variant="outline" size="sm">
          <Link href={href}>查看</Link>
        </Button>
      </div>
    </article>
  );
}
