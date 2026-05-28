import { EmptyState } from "@/components/empty-state";

interface MarkdownPreviewProps {
  content?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function MarkdownPreview({
  content,
  emptyTitle = "暂无内容",
  emptyDescription = "生成或选择内容后会在这里展示。",
}: MarkdownPreviewProps) {
  if (!content?.trim()) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="max-h-[560px] overflow-auto rounded-lg border bg-muted/30 p-4 text-sm leading-6">
      <pre className="whitespace-pre-wrap font-sans">{content}</pre>
    </div>
  );
}
