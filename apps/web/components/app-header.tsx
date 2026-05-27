import {
  Activity,
  BookOpen,
  Database,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/database", label: "数据底座", icon: Database },
  { href: "/knowledge-base", label: "知识库", icon: LibraryBig },
  { href: "/courses", label: "课程管理", icon: BookOpen },
  { href: "/students", label: "学生管理", icon: GraduationCap },
  { href: "/health", label: "Health", icon: Activity },
];

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">EduForge 智学工坊</span>
            <span className="block truncate text-xs text-muted-foreground">中国软件杯 A3</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button key={item.href} asChild variant="ghost" size="sm">
                <Link href={item.href}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              </Button>
            );
          })}
          <Button asChild size="sm">
            <Link href="/dashboard">
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              <span>Dashboard</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
