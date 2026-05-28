import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  title?: string;
  rows?: number;
}

export function LoadingState({ title = "加载中", rows = 4 }: LoadingStateProps) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <p className="text-sm text-muted-foreground">{title}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}
