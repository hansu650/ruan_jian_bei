import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { LLMModeInfo } from "@/lib/types";

interface LiveModelWarningProps {
  mode?: LLMModeInfo | null;
  compact?: boolean;
}

export function LiveModelWarning({ mode, compact = false }: LiveModelWarningProps) {
  if (!mode) {
    return null;
  }

  const isLive = mode.effective_provider === "spark-http" && mode.mode_level === "live";
  const title = isLive
    ? "真实讯飞星火模式"
    : mode.mode_level === "warning"
      ? "模型配置提醒"
      : "Mock 安全模式";
  const description = isLive
    ? "当前为真实讯飞星火模式。手动点击生成类操作会调用真实 API；页面不会显示、输入或传输密钥。"
    : mode.mode_level === "warning"
      ? mode.message
      : "当前使用 MockLLM，不调用外部 API，适合离线演示和自动化测试。";

  return (
    <Alert className={compact ? "py-3" : undefined}>
      <AlertTitle className="flex flex-wrap items-center gap-2">
        {title}
        <Badge variant={isLive ? "warning" : mode.mode_level === "safe" ? "success" : "outline"}>
          {mode.effective_provider} / {mode.model}
        </Badge>
      </AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
