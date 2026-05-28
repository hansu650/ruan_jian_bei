import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ActionConfirmCardProps {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  liveMode?: boolean;
  confirmLabel?: string;
}

export function ActionConfirmCard({
  title,
  description,
  checked,
  onCheckedChange,
  liveMode = false,
  confirmLabel = "我确认要执行该生成操作",
}: ActionConfirmCardProps) {
  return (
    <Alert className={liveMode ? "border-amber-200 bg-amber-50/60" : undefined}>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{description}</p>
        <label className="flex cursor-pointer items-start gap-2 text-sm font-medium text-foreground">
          <input
            checked={checked}
            className="mt-1"
            onChange={(event) => onCheckedChange(event.target.checked)}
            type="checkbox"
          />
          <span>{confirmLabel}</span>
        </label>
      </AlertDescription>
    </Alert>
  );
}
