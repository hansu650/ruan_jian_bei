import { AlertCircle, CheckCircle2, CircleDashed } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DemoStepStatus } from "@/lib/types";

interface DemoStepCardProps {
  step: DemoStepStatus;
}

function statusView(status: string) {
  if (status === "ready") {
    return {
      icon: CheckCircle2,
      label: "ready",
      badge: "success" as const,
      iconClass: "text-emerald-600",
    };
  }
  if (status === "warning") {
    return {
      icon: AlertCircle,
      label: "warning",
      badge: "warning" as const,
      iconClass: "text-amber-600",
    };
  }
  return {
    icon: CircleDashed,
    label: "missing",
    badge: "outline" as const,
    iconClass: "text-muted-foreground",
  };
}

export function DemoStepCard({ step }: DemoStepCardProps) {
  const view = statusView(step.status);
  const Icon = view.icon;

  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="flex min-w-0 items-center gap-2 text-base">
            <Icon className={`h-5 w-5 shrink-0 ${view.iconClass}`} aria-hidden="true" />
            <span className="truncate">{step.title}</span>
          </CardTitle>
          <Badge variant={view.badge}>{view.label}</Badge>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{step.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
          <span className="font-medium">数量：</span>
          {step.count ?? "-"}
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{step.message}</p>
        <Button asChild variant={step.status === "missing" ? "default" : "outline"} size="sm">
          <Link href={step.action_href}>{step.action_label}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
