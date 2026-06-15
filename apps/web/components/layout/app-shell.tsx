"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/layout/admin-shell";
import { StudentShell } from "@/components/layout/student-shell";

const adminPrefixes = ["/demo", "/qa", "/dashboard", "/database", "/courses", "/students", "/llm-lab", "/health"];

interface AppShellProps {
  children: ReactNode;
}

function isAdminRoute(pathname: string) {
  return adminPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  if (isAdminRoute(pathname)) {
    return <AdminShell>{children}</AdminShell>;
  }

  return <StudentShell>{children}</StudentShell>;
}
