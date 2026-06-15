import { StudentSidebar } from "@/components/v2/student-sidebar";
import { StudentTopbar } from "@/components/v2/student-topbar";
import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 lg:grid lg:grid-cols-[280px_1fr]">
      <StudentSidebar />
      <div className="min-w-0">
        <StudentTopbar />
        {children}
      </div>
    </div>
  );
}
