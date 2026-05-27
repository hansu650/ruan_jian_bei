import { Activity, LayoutDashboard, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">EduForge 智学工坊</span>
            <span className="block truncate text-xs text-muted-foreground">中国软件杯 A3</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/health">
              <Activity className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Health</span>
            </Link>
          </Button>
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
