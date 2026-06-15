import { Badge } from "@/components/ui/badge";

export const RESOURCE_TYPE_LABELS: Record<string, string> = {
  lecture_note: "讲义",
  mindmap: "思维导图",
  quiz: "练习题",
  reading: "拓展阅读",
  practice_case: "实操案例",
  video_script: "视频脚本",
};

interface ResourceTypeBadgeProps {
  type: string;
}

export function resourceTypeLabel(type: string) {
  return RESOURCE_TYPE_LABELS[type] ?? type;
}

export function ResourceTypeBadge({ type }: ResourceTypeBadgeProps) {
  return <Badge variant="secondary">{resourceTypeLabel(type)}</Badge>;
}
