import { Badge } from "@/components/ui/badge";

type BadgeVariant = "default" | "secondary" | "outline" | "success" | "warning";

const statusMap: Record<string, { label: string; variant: BadgeVariant }> = {
  done: { label: "已完成", variant: "success" },
  active: { label: "可继续", variant: "warning" },
  todo: { label: "未开始", variant: "outline" },
  ready: { label: "已准备", variant: "success" },
  missing: { label: "待补齐", variant: "outline" },
  warning: { label: "需留意", variant: "warning" },
  completed: { label: "已完成", variant: "success" },
  in_progress: { label: "进行中", variant: "warning" },
  pending: { label: "待开始", variant: "outline" },
  generated: { label: "已生成", variant: "success" },
  checked: { label: "已检查", variant: "success" },
  needs_review: { label: "需教师确认", variant: "warning" },
  grounded: { label: "有来源", variant: "success" },
  unsafe: { label: "不适合处理", variant: "warning" },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const item = statusMap[status] ?? { label: label ?? status, variant: "outline" as const };
  return (
    <Badge variant={item.variant} className={className}>
      {label ?? item.label}
    </Badge>
  );
}
