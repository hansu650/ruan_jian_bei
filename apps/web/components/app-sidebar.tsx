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
  Home,
  LayoutDashboard,
  Lightbulb,
  LibraryBig,
  ListChecks,
  MessagesSquare,
  MonitorPlay,
  Route,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const sections = [
  {
    title: "学习中心",
    items: [
      { label: "学习工作台", icon: Home, href: "/learn", state: "主入口" },
      { label: "学习画像", icon: UserRound, href: "/profile", state: "学习准备" },
      { label: "学习路径", icon: Route, href: "/learning-path", state: "计划" },
      { label: "学习资源", icon: FileText, href: "/resources", state: "资料" },
      { label: "智能辅导", icon: FileQuestion, href: "/tutor", state: "答疑" },
      { label: "练习测验", icon: ClipboardCheck, href: "/practice", state: "练习" },
      { label: "学习评估", icon: BarChart3, href: "/analytics", state: "诊断" },
    ],
  },
  {
    title: "课程与知识",
    items: [{ label: "课程知识库", icon: LibraryBig, href: "/knowledge-base", state: "来源" }],
  },
  {
    title: "架构与亮点",
    items: [
      { label: "智能体协作", icon: Bot, href: "/agents-flow", state: "架构" },
      { label: "创新亮点", icon: Lightbulb, href: "/innovation", state: "亮点" },
    ],
  },
  {
    title: "演示与测试",
    items: [
      { label: "演示工作台", icon: MonitorPlay, href: "/demo", state: "准备" },
      { label: "测试清单", icon: ListChecks, href: "/qa", state: "自测" },
    ],
  },
  {
    title: "项目与管理",
    items: [
      { label: "项目总览", icon: LayoutDashboard, href: "/dashboard", state: "总览" },
      { label: "数据底座", icon: Database, href: "/database", state: "数据" },
      { label: "课程管理", icon: BookOpen, href: "/courses", state: "管理" },
      { label: "学生管理", icon: GraduationCap, href: "/students", state: "管理" },
      { label: "模型实验室", icon: MessagesSquare, href: "/llm-lab", state: "调试" },
      { label: "Health", icon: Activity, href: "/health", state: "联调" },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-slate-950">EduForge 学习平台</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          学生从学习工作台开始，演示和测试入口保留在辅助区域。
        </p>
      </div>
      <Separator className="my-4" />
      <div className="space-y-5">
        {sections.map((section) => (
          <div key={section.title} className="space-y-2">
            <p className="px-1 text-xs font-medium text-slate-500">{section.title}</p>
            <div className="space-y-1.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const primary = item.href === "/learn";
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-md border px-3 py-2 transition",
                      active
                        ? "border-sky-300 bg-sky-100 font-medium text-sky-950 shadow-sm hover:border-sky-300"
                        : "border-transparent bg-background hover:border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active || primary ? "text-sky-800" : "text-slate-500",
                        )}
                        aria-hidden="true"
                      />
                      <span className="truncate text-sm">{item.label}</span>
                    </div>
                    <Badge variant={active || primary ? "default" : "outline"} className="shrink-0">
                      {item.state}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
