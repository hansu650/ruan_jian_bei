import type { ReactNode } from "react";

import { StudentTopNav } from "@/components/layout/student-top-nav";

interface StudentShellProps {
  children: ReactNode;
}

export function StudentShell({ children }: StudentShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <StudentTopNav />
      {children}
    </div>
  );
}
