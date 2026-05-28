"use client";

import { PlayCircle, RefreshCw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { DemoStepCard } from "@/components/demo-step-card";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { ModelModeBadge } from "@/components/model-mode-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bootstrapDemoData, getDemoStatus } from "@/lib/api";
import type { DemoBootstrapResponse, DemoStatusResponse } from "@/lib/types";

const demoRoute = [
  { href: "/demo", label: "准备基础数据" },
  { href: "/knowledge-base", label: "搜索“幻读”" },
  { href: "/profile", label: "生成 8 维画像" },
  { href: "/learning-path", label: "生成 7 天路径" },
  { href: "/resources", label: "生成 6 类资源" },
  { href: "/tutor", label: "智能辅导问答" },
  { href: "/practice", label: "生成并提交测验" },
  { href: "/analytics", label: "查看评估报告" },
];

export default function DemoPage() {
  const [status, setStatus] = useState<DemoStatusResponse | null>(null);
  const [bootstrapResult, setBootstrapResult] = useState<DemoBootstrapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDemoStatus();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "无法读取演示状态。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const nextStep = useMemo(() => {
    if (!status?.next_recommended_step) {
      return null;
    }
    return status.steps.find((step) => step.key === status.next_recommended_step) ?? null;
  }, [status]);

  async function handleBootstrap() {
    setBootstrapping(true);
    setError(null);
    try {
      const result = await bootstrapDemoData();
      setBootstrapResult(result);
      const refreshed = await getDemoStatus();
      setStatus(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "基础演示数据准备失败。");
    } finally {
      setBootstrapping(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <AppSidebar />

        <div className="space-y-6">
          <section className="rounded-lg border bg-card p-6">
            <Badge variant="warning">Phase 11 进行中</Badge>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">演示工作台</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              这里是比赛现场演示前的检查入口，用来确认知识库、学习画像、学习路径、资源生成、智能辅导、
              练习测验和学习评估是否已经准备好。工作台只做状态检查和基础资料导入，不会自动调用 LLM。
            </p>
          </section>

          {loading ? <LoadingState title="正在读取演示状态" rows={5} /> : null}
          {error ? <ErrorState message={error} onRetry={loadStatus} /> : null}

          {!loading && !error && status ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center gap-3 text-base">
                    <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                    LLM 模式
                    <ModelModeBadge mode={status.llm_mode} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 text-sm md:grid-cols-4">
                    <div className="rounded-md border bg-muted/30 px-3 py-2">
                      <p className="text-xs text-muted-foreground">Provider</p>
                      <p className="font-medium">{status.llm_mode.effective_provider}</p>
                    </div>
                    <div className="rounded-md border bg-muted/30 px-3 py-2">
                      <p className="text-xs text-muted-foreground">Model</p>
                      <p className="font-medium">{status.llm_mode.model}</p>
                    </div>
                    <div className="rounded-md border bg-muted/30 px-3 py-2">
                      <p className="text-xs text-muted-foreground">Mock</p>
                      <p className="font-medium">{status.llm_mode.use_mock_llm ? "true" : "false"}</p>
                    </div>
                    <div className="rounded-md border bg-muted/30 px-3 py-2">
                      <p className="text-xs text-muted-foreground">Spark HTTP</p>
                      <p className="font-medium">
                        {status.llm_mode.spark_http_configured ? "configured" : "not configured"}
                      </p>
                    </div>
                  </div>
                  <Alert
                    className={
                      status.llm_mode.mode_level === "live"
                        ? "border-amber-200 bg-amber-50 text-amber-900"
                        : ""
                    }
                    variant={status.llm_mode.mode_level === "safe" ? "success" : "default"}
                  >
                    <AlertTitle>{status.llm_mode.mode_label}</AlertTitle>
                    <AlertDescription>{status.llm_mode.message}</AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <section className="grid gap-4 md:grid-cols-[1fr_auto]">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">基础演示数据</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm leading-6 text-muted-foreground">
                      点击后只会确保默认学生、数据库系统课程、知识点和原创 Markdown 示例资料就绪。
                      不会生成画像、路径、资源、辅导会话、测验，也不会调用 Spark 或 MockLLM。
                    </p>
                    {bootstrapResult ? (
                      <Alert variant="success">
                        <AlertTitle>准备完成</AlertTitle>
                        <AlertDescription>
                          {bootstrapResult.message} 当前 chunk 数：{bootstrapResult.chunk_count}
                        </AlertDescription>
                      </Alert>
                    ) : null}
                  </CardContent>
                </Card>
                <div className="flex items-stretch">
                  <Button
                    type="button"
                    className="h-full min-h-28 w-full md:w-52"
                    onClick={handleBootstrap}
                    disabled={bootstrapping}
                  >
                    {bootstrapping ? (
                      <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <PlayCircle className="h-4 w-4" aria-hidden="true" />
                    )}
                    准备基础演示数据
                  </Button>
                </div>
              </section>

              {nextStep ? (
                <Alert className="border-primary/30 bg-primary/5">
                  <AlertTitle>建议下一步：{nextStep.title}</AlertTitle>
                  <AlertDescription className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span>{nextStep.message}</span>
                    <Button asChild size="sm">
                      <Link href={nextStep.action_href}>{nextStep.action_label}</Link>
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="success">
                  <AlertTitle>演示闭环已基本就绪</AlertTitle>
                  <AlertDescription>所有核心步骤均为 ready 或 warning，可以按路线开始人工演示。</AlertDescription>
                </Alert>
              )}

              <section>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">演示准备状态</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      当前默认学生：{status.student_name ?? "-"}；默认课程：{status.course_title ?? "-"}
                    </p>
                  </div>
                  <Badge variant={status.overall_ready ? "success" : "warning"}>
                    {status.overall_ready ? "整体可演示" : "仍有缺口"}
                  </Badge>
                </div>
                {status.steps.length ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {status.steps.map((step) => (
                      <DemoStepCard key={step.key} step={step} />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="暂无状态" description="后端尚未返回演示步骤，请稍后重试。" />
                )}
              </section>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">推荐演示路线</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="grid gap-2 md:grid-cols-2">
                    {demoRoute.map((item, index) => (
                      <li key={item.href} className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                        <span className="mr-2 font-semibold text-primary">{index + 1}.</span>
                        <Link href={item.href} className="font-medium hover:underline">
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
