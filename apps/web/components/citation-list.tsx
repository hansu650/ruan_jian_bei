import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type CitationInput = string | Array<Record<string, unknown>> | null | undefined;

interface CitationListProps {
  citations: CitationInput;
  emptyText?: string;
}

function parseCitations(value: CitationInput): {
  items: Array<Record<string, unknown>>;
  error: boolean;
} {
  if (!value) {
    return { items: [], error: false };
  }
  if (Array.isArray(value)) {
    return { items: value, error: false };
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    return { items: Array.isArray(parsed) ? (parsed as Array<Record<string, unknown>>) : [], error: false };
  } catch {
    return { items: [], error: true };
  }
}

function text(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

export function CitationList({
  citations,
  emptyText = "暂无引用来源。",
}: CitationListProps) {
  const parsed = parseCitations(citations);
  if (parsed.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>引用来源解析失败</AlertTitle>
        <AlertDescription>citations_json 不是有效 JSON，请检查后端返回。</AlertDescription>
      </Alert>
    );
  }
  if (!parsed.items.length) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }
  return (
    <div className="space-y-2">
      {parsed.items.map((item, index) => {
        const filename = text(item.filename) || "未知文件";
        const chunkIndex = text(item.chunk_index);
        const sectionTitle = text(item.section_title) || "未命名小节";
        const quote = text(item.quote) || text(item.quote_preview) || "未提供片段";
        return (
          <div key={`${filename}-${chunkIndex}-${index}`} className="rounded-lg border bg-background p-3 text-sm">
            <p className="font-medium">
              {filename}
              {chunkIndex ? ` / chunk ${chunkIndex}` : ""}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{sectionTitle}</p>
            <p className="mt-2 leading-6">{quote}</p>
          </div>
        );
      })}
    </div>
  );
}
