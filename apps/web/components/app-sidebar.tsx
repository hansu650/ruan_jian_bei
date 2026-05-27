import { BookOpen, FlaskConical, GraduationCap, Route, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { label: "课程管理", state: "后续阶段", icon: BookOpen },
  { label: "学习画像", state: "待实现", icon: GraduationCap },
  { label: "学习路径", state: "待实现", icon: Route },
  { label: "资源生成", state: "待实现", icon: FlaskConical },
  { label: "防幻觉校验", state: "待实现", icon: ShieldCheck },
];

export function AppSidebar() {
  return (
    <aside className="rounded-lg border bg-card p-4">
      <div>
        <p className="text-sm font-semibold">EduForge 控制台</p>
        <p className="mt-1 text-xs text-muted-foreground">第二阶段只展示演示骨架</p>
      </div>
      <Separator className="my-4" />
      <div className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate text-sm">{item.label}</span>
              </div>
              <Badge variant="outline" className="shrink-0">
                {item.state}
              </Badge>
            </div>
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
