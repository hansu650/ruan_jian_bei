"use client";

import { MonitorPlay, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getDemoStatus } from "@/lib/api";
import type { DemoStatusResponse } from "@/lib/types";
import { StatusPill } from "@/components/v2/status-pill";

function modeLabel(status: DemoStatusResponse | null) {
  const mode = status?.llm_mode;
  if (!mode) {
    return "模型模式读取中";
  }
  if (mode.effective_provider === "spark-http") {
    return `Spark Lite · ${mode.model || mode.spark_model || "lite"}`;
  }
  return "Mock 模式";
}

export function StudentTopbar() {
  const [status, setStatus] = useState<DemoStatusResponse | null>(null);

  useEffect(() => {
    let mounted = true;
    getDemoStatus()
      .then((next) => {
        if (mounted) setStatus(next);
      })
      .catch(() => {
        if (mounted) setStatus(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const liveMode = status?.llm_mode.effective_provider === "spark-http";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-950">
            当前课程：{status?.course_title ?? "数据库系统"}
          </p>
          <p className="truncate text-xs text-slate-500">
            当前学生：{status?.student_name ?? "示例学生"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <StatusPill tone={liveMode ? "warning" : "success"}>
            <Sparkles className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            {modeLabel(status)}
          </StatusPill>
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link href="/demo">
              <MonitorPlay className="h-4 w-4" aria-hidden="true" />
              演示准备
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
