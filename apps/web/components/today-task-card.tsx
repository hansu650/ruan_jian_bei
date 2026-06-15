import Link from "next/link";
import { HelpCircle, LibraryBig, ListChecks, Route } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LearningPathStep } from "@/lib/types";

interface TodayTaskCardProps {
  step?: LearningPathStep | null;
  reason: string;
}

const sequence = [
  { label: "看讲义", icon: LibraryBig, href: "/resources" },
  { label: "看思维导图", icon: Route, href: "/resources" },
  { label: "提问答疑", icon: HelpCircle, href: "/tutor" },
  { label: "做小测", icon: ListChecks, href: "/practice" },
];

function parseJsonArray(value?: string | null): string[] {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function TodayTaskCard({ step, reason }: TodayTaskCardProps) {
  const knowledgePoints = parseJsonArray(step?.knowledge_points_json);

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">今日推荐学习</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          按小步推进：先理解，再追问，最后用练习验证。
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {step ? (
          <div className="rounded-lg border border-sky-100 bg-sky-50/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-sky-700">
              推荐主题
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {step.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{step.objective}</p>
            <p className="mt-3 text-sm font-medium text-sky-800">{reason}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary">预计 {step.estimated_minutes} 分钟</Badge>
              {knowledgePoints.slice(0, 4).map((point) => (
                <Badge key={point} variant="outline">
                  {point}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed bg-slate-50 p-4">
            <h2 className="text-lg font-semibold text-slate-950">还没有学习路径</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              先生成你的个性化学习计划，系统就能推荐今天最适合推进的主题。
            </p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sequence.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-lg border border-slate-200 bg-white p-3 transition hover:border-sky-200 hover:bg-sky-50/50"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                    {index + 1}
                  </span>
                  <Icon className="h-4 w-4 text-sky-700" aria-hidden="true" />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-900">{item.label}</p>
              </Link>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/learning-path">查看学习路径</Link>
          </Button>
          <Button asChild>
            <Link href={step ? "/resources" : "/learning-path"}>
              {step ? "开始这一步" : "先生成学习路径"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
