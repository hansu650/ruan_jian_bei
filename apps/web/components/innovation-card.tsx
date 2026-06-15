import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InnovationCardProps {
  index: number;
  title: string;
  description: string;
  proof: string[];
  icon: LucideIcon;
}

export function InnovationCard({
  index,
  title,
  description,
  proof,
  icon: Icon,
}: InnovationCardProps) {
  return (
    <Card className="h-full border-slate-200 bg-white shadow-sm transition hover:border-sky-200 hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <Badge variant="outline">创新点 {index}</Badge>
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-7 text-slate-600">{description}</p>
        <div className="flex flex-wrap gap-2">
          {proof.map((item) => (
            <Badge key={item} variant="secondary">
              {item}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
