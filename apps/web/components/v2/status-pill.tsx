import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const toneClass = {
  default: "border-slate-200 bg-slate-50 text-slate-700",
  active: "border-sky-200 bg-sky-50 text-sky-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
};

interface StatusPillProps {
  children: ReactNode;
  tone?: keyof typeof toneClass;
  className?: string;
}

export function StatusPill({ children, tone = "default", className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
