import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  href?: string;
}

export function EmptyState({ title, description, actionLabel, href }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-3 p-6">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {actionLabel && href ? (
          <Button asChild variant="outline" size="sm">
            <Link href={href}>{actionLabel}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
