import {
  BookOpen,
  Database,
  FileText,
  GraduationCap,
  LibraryBig,
  MessagesSquare,
  Route,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { label: "数据底座", state: "已完成", icon: Database, href: "/database" },
  { label: "课程知识库", state: "已完成", icon: LibraryBig, href: "/knowledge-base" },
  { label: "模型实验室", state: "已完成", icon: MessagesSquare, href: "/llm-lab" },
  { label: "学习画像", state: "已完成", icon: UserRound, href: "/profile" },
  { label: "学习路径", state: "已完成", icon: Route, href: "/learning-path" },
  { label: "资源生成", state: "进行中", icon: FileText, href: "/resources" },
  { label: "课程管理", state: "可查看", icon: BookOpen, href: "/courses" },
  { label: "学生管理", state: "可查看", icon: GraduationCap, href: "/students" },
  { label: "防幻觉校验", state: "待开始", icon: ShieldCheck, href: "/dashboard" },
];

export function AppSidebar() {
  return (
    <aside className="rounded-lg border bg-card p-4">
      <div>
        <p className="text-sm font-semibold">EduForge 控制台</p>
        <p className="mt-1 text-xs text-muted-foreground">
          第八阶段建设 A3 核心能力：多类型学习资源生成。
        </p>
      </div>
      <Separator className="my-4" />
      <div className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 hover:border-primary/40"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate text-sm">{item.label}</span>
              </div>
              <Badge variant={item.state === "进行中" ? "warning" : "outline"} className="shrink-0">
                {item.state}
              </Badge>
            </Link>
          );
        })}
      </div>
      <Separator className="my-4" />
      <Link href="/health" className="text-sm font-medium text-primary hover:underline">
        查看联调状态
      </Link>
    </aside>
  );
}
