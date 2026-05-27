import { CheckCircle2, Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FeatureCardProps {
  title: string;
  status: string;
  description: string;
}

export function FeatureCard({ title, status, description }: FeatureCardProps) {
  const isReady = status === "已完成";
  const isActive = status === "进行中";
  const Icon = isReady ? CheckCircle2 : Clock3;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <Badge variant={isReady ? "success" : isActive ? "warning" : "outline"}>{status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
