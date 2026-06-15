import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";

interface AgentFlowCardProps {
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

export function AgentFlowCard({
  name,
  title,
  role,
  input,
  output,
  data,
  next,
  href,
  icon: Icon,
}: AgentFlowCardProps) {
  return (
    <Card className="h-full border-slate-200 bg-white shadow-sm transition hover:border-sky-200 hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <StatusBadge status="ready" label={name} />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="leading-6 text-slate-600">{role}</p>
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p>
            <span className="font-medium text-slate-900">输入：</span>
            <span className="text-slate-600">{input}</span>
          </p>
          <p>
            <span className="font-medium text-slate-900">输出：</span>
            <span className="text-slate-600">{output}</span>
          </p>
          <p>
            <span className="font-medium text-slate-900">沉淀数据：</span>
            <span className="text-slate-600">{data}</span>
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500">下一环节：{next}</span>
          <Button asChild variant="outline" size="sm">
            <Link href={href}>查看页面</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
