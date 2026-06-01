import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface WeakPointCardProps {
  weakPoints: string[];
  mastery: Record<string, number>;
}

export function WeakPointCard({ weakPoints, mastery }: WeakPointCardProps) {
  const masteryEntries = Object.entries(mastery).slice(0, 5);
  const priority = weakPoints.slice(0, 3);

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <CardTitle>薄弱点与建议</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          优先补齐低掌握度主题，再进入综合复习。
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {priority.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {priority.map((item) => (
              <Badge key={item} variant="warning">
                {item}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed bg-slate-50 p-3 text-sm text-slate-600">
            画像完成后，这里会显示系统建议优先补齐的知识点。
          </p>
        )}

        {masteryEntries.length > 0 ? (
          <div className="space-y-4">
            {masteryEntries.map(([name, value]) => (
              <div key={name}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{name}</span>
                  <span className="text-slate-500">{Math.round(value)}%</span>
                </div>
                <Progress value={Math.max(0, Math.min(100, value))} />
              </div>
            ))}
          </div>
        ) : null}

        <Button asChild variant="outline" size="sm">
          <Link href="/profile">查看学习画像</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
