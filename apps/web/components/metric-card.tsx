import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  helper?: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning";
}

const toneClass = {
  default: "bg-sky-50 text-sky-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
};

export function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "default",
}: MetricCardProps) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
          </div>
          {Icon ? (
            <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", toneClass[tone])}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
          ) : null}
        </div>
        {helper ? <p className="mt-3 text-sm leading-5 text-slate-500">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}
