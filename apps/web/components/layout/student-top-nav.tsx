"use client";

import { BarChart3, BookOpenText, Bot, ClipboardCheck, FileQuestion, FileText, GraduationCap, Home, MonitorPlay, Route, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { getDemoStatus } from "@/lib/api";
import type { DemoStatusResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

const primaryNav = [
  { href: "/learn", label: "工作台", icon: Home },
  { href: "/profile", label: "画像", icon: UserRound },
  { href: "/learning-path", label: "路径", icon: Route },
  { href: "/resources", label: "资源", icon: FileText },
  { href: "/tutor", label: "辅导", icon: FileQuestion },
  { href: "/practice", label: "练习", icon: ClipboardCheck },
  { href: "/analytics", label: "评估", icon: BarChart3 },
];

const secondaryNav = [
  { href: "/knowledge-base", label: "知识库", icon: BookOpenText },
  { href: "/agents-flow", label: "智能体", icon: Bot },
  { href: "/innovation", label: "亮点", icon: GraduationCap },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  if (href === "/resources") {
    return pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith("/generated-resources");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function modeLabel(status: DemoStatusResponse | null) {
  const mode = status?.llm_mode;
  if (!mode) {
    return "读取中";
  }
  if (mode.effective_provider === "spark-http") {
    return `Spark · ${mode.model || mode.spark_model || "lite"}`;
  }
  return "Mock";
}

export function StudentTopNav() {
  const pathname = usePathname();
  const [status, setStatus] = useState<DemoStatusResponse | null>(null);

  useEffect(() => {
    let mounted = true;
    getDemoStatus()
      .then((next) => {
        if (mounted) {
          setStatus(next);
        }
      })
      .catch(() => {
        if (mounted) {
          setStatus(null);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const liveMode = status?.llm_mode.effective_provider === "spark-http";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/learn" className="flex shrink-0 items-center gap-3" aria-label="回到学习工作台">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-700 text-white shadow-sm">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="hidden sm:block">
            <span className="block text-sm font-semibold leading-5 text-slate-950">EduForge</span>
            <span className="block text-xs leading-4 text-slate-500">智学工坊</span>
          </span>
        </Link>

        <nav className="flex min-w-0 flex-1 items-center justify-center gap-1" aria-label="学生学习导航">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition",
                  active
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950",
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-blue-700" : "text-slate-400")} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="hidden items-center gap-1 xl:flex">
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition",
                    active
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-blue-700" : "text-slate-400")} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium",
              liveMode ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700",
            )}
          >
            {modeLabel(status)}
          </span>
          <Link
            href="/demo"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
          >
            <MonitorPlay className="h-4 w-4" aria-hidden="true" />
            演示
          </Link>
        </div>
      </div>
    </header>
  );
}
