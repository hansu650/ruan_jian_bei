import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorPanelProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorPanel({ title = "页面暂时无法加载", message, onRetry }: ErrorPanelProps) {
  return (
    <Alert variant="destructive" className="rounded-2xl">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">{message}</AlertDescription>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          重新加载
        </Button>
      ) : null}
    </Alert>
  );
}
