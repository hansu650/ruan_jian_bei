"use client";

import { Activity, BookOpen, Database, GraduationCap, LayoutDashboard, ListChecks, MessagesSquare, MonitorPlay } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/demo", label: "演示工作台", icon: MonitorPlay },
  { href: "/qa", label: "测试清单", icon: ListChecks },
  { href: "/dashboard", label: "项目总览", icon: LayoutDashboard },
  { href: "/database", label: "数据底座", icon: Database },
  { href: "/courses", label: "课程管理", icon: BookOpen },
  { href: "/students", label: "学生管理", icon: GraduationCap },
  { href: "/llm-lab", label: "模型实验室", icon: MessagesSquare },
  { href: "/health", label: "Health", icon: Activity },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-slate-200 bg-white lg:block">
        <div className="sticky top-0 flex h-screen flex-col px-4 py-5">
          <Link href="/learn" className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-950">EduForge 智学工坊</p>
            <p className="mt-1 text-xs text-slate-500">演示与项目管理</p>
          </Link>
          <nav className="mt-6 space-y-1" aria-label="演示与管理导航">
            {adminNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition",
                    active
                      ? "border-blue-200 bg-blue-50 font-medium text-blue-700"
                      : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-blue-700" : "text-slate-400")} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <Link
            href="/learn"
            className="mt-auto rounded-xl border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            返回学习端
          </Link>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
