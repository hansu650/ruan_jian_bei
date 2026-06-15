"use client";

import {
  Activity,
  BarChart3,
  Bot,
  BookOpen,
  ClipboardCheck,
  Database,
  FileQuestion,
  FileText,
  GraduationCap,
  HeartPulse,
  Home,
  LayoutDashboard,
  Lightbulb,
  LibraryBig,
  ListChecks,
  MessagesSquare,
  MonitorPlay,
  Route,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const sections = [
  {
    title: "学习中心",
    items: [
      { label: "学习工作台", icon: Home, href: "/learn" },
      { label: "学习画像", icon: UserRound, href: "/profile" },
      { label: "学习路径", icon: Route, href: "/learning-path" },
      { label: "学习资源", icon: FileText, href: "/resources" },
      { label: "智能辅导", icon: FileQuestion, href: "/tutor" },
      { label: "练习测验", icon: ClipboardCheck, href: "/practice" },
      { label: "学习评估", icon: BarChart3, href: "/analytics" },
    ],
  },
  {
    title: "课程资料",
    items: [{ label: "知识库", icon: LibraryBig, href: "/knowledge-base" }],
  },
  {
    title: "项目亮点",
    items: [
      { label: "智能体协作", icon: Bot, href: "/agents-flow" },
      { label: "创新亮点", icon: Lightbulb, href: "/innovation" },
    ],
  },
  {
    title: "演示与测试",
    items: [
      { label: "演示工作台", icon: MonitorPlay, href: "/demo" },
      { label: "测试清单", icon: ListChecks, href: "/qa" },
    ],
  },
  {
    title: "项目管理",
    items: [
      { label: "项目总览", icon: LayoutDashboard, href: "/dashboard" },
      { label: "数据底座", icon: Database, href: "/database" },
      { label: "课程管理", icon: BookOpen, href: "/courses" },
      { label: "学生管理", icon: GraduationCap, href: "/students" },
      { label: "模型实验室", icon: MessagesSquare, href: "/llm-lab" },
      { label: "Health", icon: Activity, href: "/health" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/resources") {
    return pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith("/generated-resources");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StudentSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen overflow-y-auto border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:block">
      <div className="flex min-h-screen flex-col px-4 py-5">
        <Link href="/learn" className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-700 text-white shadow-sm">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-slate-950">EduForge 智学工坊</span>
            <span className="block text-xs text-slate-500">AI 个性化学习助手</span>
          </span>
        </Link>

        <nav className="mt-6 space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="px-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                {section.title}
              </p>
              <div className="mt-2 space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition",
                        active
                          ? "border-sky-200 bg-sky-50 font-medium text-sky-700 shadow-sm"
                          : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950",
                      )}
                    >
                      <Icon
                        className={cn("h-4 w-4 shrink-0", active ? "text-sky-700" : "text-slate-400")}
                        aria-hidden="true"
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
            <HeartPulse className="h-4 w-4 text-sky-700" aria-hidden="true" />
            学习闭环
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            画像、路径、资源、辅导、练习和评估会围绕同一门课程持续沉淀。
          </p>
        </div>
      </div>
    </aside>
  );
}
