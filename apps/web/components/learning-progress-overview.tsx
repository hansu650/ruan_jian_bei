import type { LucideIcon } from "lucide-react";

import { MetricCard } from "@/components/metric-card";

interface LearningProgressItem {
  label: string;
  value: string;
  helper: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning";
}

interface LearningProgressOverviewProps {
  items: LearningProgressItem[];
}

export function LearningProgressOverview({ items }: LearningProgressOverviewProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <MetricCard
          key={item.label}
          label={item.label}
          value={item.value}
          helper={item.helper}
          icon={item.icon}
          tone={item.tone}
        />
      ))}
    </div>
  );
}
