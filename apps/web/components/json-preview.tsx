interface JsonPreviewProps {
  value: string | unknown;
  emptyText?: string;
}

export function JsonPreview({ value, emptyText = "暂无 JSON 数据。" }: JsonPreviewProps) {
  if (value === null || value === undefined || value === "") {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  let content: string;
  let parsed = false;
  if (typeof value === "string") {
    try {
      content = JSON.stringify(JSON.parse(value) as unknown, null, 2);
      parsed = true;
    } catch {
      content = value;
    }
  } else {
    content = JSON.stringify(value, null, 2);
    parsed = true;
  }

  return (
    <pre className="max-h-72 overflow-auto rounded-lg border bg-muted/30 p-3 text-xs leading-5">
      {parsed ? content : `解析失败，显示原文：\n${content}`}
    </pre>
  );
}
