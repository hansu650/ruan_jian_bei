"use client";

import { CheckCircle2, ClipboardList, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ErrorState } from "@/components/error-state";
import { LiveModelWarning } from "@/components/live-model-warning";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getDemoStatus, getQAChecklist, getQASmokeStatus } from "@/lib/api";
import type {
  DemoStatusResponse,
  QACheckItem,
  QAChecklistResponse,
  QASmokeStatusResponse,
} from "@/lib/types";

function statusVariant(status: string): "success" | "warning" | "outline" {
  if (status === "ok") {
    return "success";
  }
  if (status === "warning") {
    return "warning";
  }
  return "outline";
}

function priorityVariant(priority: string): "warning" | "outline" | "secondary" {
  if (priority === "high") {
    return "warning";
  }
  if (priority === "medium") {
    return "secondary";
  }
  return "outline";
}

function groupByModule(items: QACheckItem[]): Array<[string, QACheckItem[]]> {
  const groups = new Map<string, QACheckItem[]>();
  items.forEach((item) => {
    groups.set(item.module, [...(groups.get(item.module) ?? []), item]);
  });
  return Array.from(groups.entries());
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "请求失败，请确认后端服务是否启动。";
}

export default function QAPage() {
  const [demoStatus, setDemoStatus] = useState<DemoStatusResponse | null>(null);
  const [checklist, setChecklist] = useState<QAChecklistResponse | null>(null);
  const [smokeStatus, setSmokeStatus] = useState<QASmokeStatusResponse | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextDemoStatus, nextChecklist, nextSmokeStatus] = await Promise.all([
        getDemoStatus(),
        getQAChecklist(),
        getQASmokeStatus(),
      ]);
      setDemoStatus(nextDemoStatus);
      setChecklist(nextChecklist);
      setSmokeStatus(nextSmokeStatus);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const groupedItems = useMemo(
    () => groupByModule(checklist?.items ?? []),
    [checklist?.items],
  );
  const totalCount = checklist?.items.length ?? 0;
  const checkedCount = checklist?.items.filter((item) => checked[item.id]).length ?? 0;
  const progress = totalCount ? Math.round((checkedCount / totalCount) * 100) : 0;

  function toggleItem(id: string) {
    setChecked((current) => ({ ...current, [id]: !current[id] }));
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="人工测试清单"
        description="这个页面用于团队在录屏、答辩或提交前逐项检查功能链路，不会自动调用大模型，也不会自动消耗 Spark 额度。"
        phase="Phase 13"
        badges={[
          <Badge key="manual" variant="outline">
            手动检查
          </Badge>,
          <Badge key="no-auto-llm" variant="success">
            不自动调用 LLM
          </Badge>,
        ]}
      />

      {loading ? <LoadingState title="正在读取 QA 清单和 Smoke 状态" rows={6} /> : null}

      {error ? <ErrorState title="QA 状态暂不可用" message={error} onRetry={() => void load()} /> : null}

      {!loading && !error ? (
        <>
          <LiveModelWarning mode={demoStatus?.llm_mode} />

          <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardList className="h-5 w-5 text-primary" aria-hidden="true" />
                  测试进度
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      已通过 {checkedCount} / {totalCount}
                    </span>
                    <span className="text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress className="mt-2" value={progress} />
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  勾选状态只保存在当前页面内存中，刷新后会重置。它用于人工演示前的快速核对，不写入数据库。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Smoke Status</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {smokeStatus?.items.map((item) => (
                  <div key={item.key} className="rounded-lg border bg-background p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{item.title}</p>
                      <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                    </div>
                    <p className="mt-2 text-muted-foreground">{item.message}</p>
                    {item.count !== null && item.count !== undefined ? (
                      <p className="mt-2 text-xs text-muted-foreground">count: {item.count}</p>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            {groupedItems.map(([module, items]) => (
              <Card key={module}>
                <CardHeader>
                  <CardTitle className="text-base">{module}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 lg:grid-cols-2">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-lg border bg-background p-4">
                      <div className="flex items-start justify-between gap-3">
                        <label className="flex min-w-0 cursor-pointer items-start gap-3">
                          <input
                            checked={Boolean(checked[item.id])}
                            className="mt-1"
                            onChange={() => toggleItem(item.id)}
                            type="checkbox"
                          />
                          <span className="min-w-0">
                            <span className="block font-medium">{item.title}</span>
                            <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                              {item.description}
                            </span>
                          </span>
                        </label>
                        {checked[item.id] ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                        ) : null}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant={priorityVariant(item.priority)}>{item.priority}</Badge>
                        {item.requires_llm ? <Badge variant="outline">需要生成</Badge> : null}
                        {item.may_call_spark ? <Badge variant="warning">Spark 可能调用</Badge> : null}
                      </div>

                      <div className="mt-3 space-y-2 text-sm">
                        <p>
                          <span className="font-medium">预期：</span>
                          <span className="text-muted-foreground">{item.expected_result}</span>
                        </p>
                        <p>
                          <span className="font-medium">提示：</span>
                          <span className="text-muted-foreground">{item.status_hint}</span>
                        </p>
                      </div>

                      <Button asChild className="mt-4" variant="outline" size="sm">
                        <Link href={item.route}>
                          前往页面
                          <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </section>
        </>
      ) : null}
    </main>
  );
}
