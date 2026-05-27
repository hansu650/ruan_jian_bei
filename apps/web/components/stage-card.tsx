import { CheckCircle2, CircleDashed, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { StageStatus } from "@/lib/types";

interface StageCardProps {
  name: string;
  description: string;
  status: StageStatus;
}

export function StageCard({ name, description, status }: StageCardProps) {
  const Icon = status === "已完成" ? CheckCircle2 : status === "进行中" ? Loader2 : CircleDashed;
  const badgeVariant = status === "已完成" ? "success" : status === "进行中" ? "warning" : "outline";

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <Badge variant={badgeVariant}>{status}</Badge>
      </CardContent>
    </Card>
  );
}
