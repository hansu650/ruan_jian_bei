"use client";

import {
  BarChart3,
  ClipboardCheck,
  FileQuestion,
  FileText,
  Home,
  LayoutDashboard,
  LibraryBig,
  Route,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/learn", label: "学习工作台", icon: Home },
  { href: "/profile", label: "学习画像", icon: UserRound },
  { href: "/learning-path", label: "学习路径", icon: Route },
  { href: "/resources", label: "学习资源", icon: FileText },
  { href: "/tutor", label: "智能辅导", icon: FileQuestion },
  { href: "/practice", label: "练习", icon: ClipboardCheck },
  { href: "/analytics", label: "学习评估", icon: BarChart3 },
  { href: "/knowledge-base", label: "知识库", icon: LibraryBig },
];

function isActive(pathname: string, href: string) {
  if (href === "/learn") {
    return pathname === "/learn";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/learn" className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-700 text-white">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">EduForge 智学工坊</span>
            <span className="block truncate text-xs text-muted-foreground">个性化学习平台</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                size="sm"
                className={cn(
                  "border border-transparent text-slate-600",
                  active && "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50",
                )}
              >
                <Link href={item.href}>
                  <Icon className={cn("h-4 w-4", active ? "text-sky-700" : "text-slate-500")} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              </Button>
            );
          })}
        </nav>

        <Button
          asChild
          size="sm"
          variant={pathname === "/dashboard" ? "default" : "outline"}
          className="shrink-0"
        >
          <Link href="/dashboard">
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            <span>总览</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
