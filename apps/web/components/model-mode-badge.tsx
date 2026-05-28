import { Badge } from "@/components/ui/badge";
import type { LLMModeInfo } from "@/lib/types";

interface ModelModeBadgeProps {
  mode: LLMModeInfo;
}

export function ModelModeBadge({ mode }: ModelModeBadgeProps) {
  const variant =
    mode.mode_level === "safe" ? "success" : mode.mode_level === "live" ? "warning" : "outline";
  const label =
    mode.mode_level === "live"
      ? `${mode.mode_label} · ${mode.model}`
      : mode.mode_level === "safe"
        ? mode.mode_label
        : `${mode.mode_label} · ${mode.effective_provider}`;

  return <Badge variant={variant}>{label}</Badge>;
}
