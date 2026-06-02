import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { EmptyState } from "@/components/empty-state";
import { MermaidDiagram } from "@/components/mermaid-diagram";

interface MarkdownPreviewProps {
  content?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
}

const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="mt-2 text-2xl font-bold text-slate-950">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-6 text-xl font-semibold text-slate-950">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-5 text-lg font-semibold text-slate-900">{children}</h3>,
  p: ({ children }) => <p className="my-3 leading-7 text-slate-700">{children}</p>,
  ul: ({ children }) => <ul className="my-3 list-disc space-y-2 pl-6 text-slate-700">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-2 pl-6 text-slate-700">{children}</ol>,
  li: ({ children }) => <li className="leading-7">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-4 border-sky-200 bg-sky-50 px-4 py-2 text-slate-700">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-auto rounded-lg border">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b bg-slate-50 px-3 py-2 text-left font-semibold text-slate-900">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border-b px-3 py-2 align-top text-slate-700">{children}</td>,
  a: ({ children, href }) => (
    <a href={href} className="font-medium text-sky-700 underline underline-offset-4" target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }) => {
    const language = /language-([^\s]+)/.exec(className ?? "")?.[1]?.toLowerCase() ?? "";
    const code = String(children).replace(/\n$/, "");

    if (language === "mermaid") {
      return <MermaidDiagram chart={code} />;
    }

    if (language) {
      return (
        <pre className="my-4 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-50">
          <div className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
            {language === "sql" ? "SQL" : language}
          </div>
          <code className="font-mono">{code}</code>
        </pre>
      );
    }

    return <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm text-slate-900">{children}</code>;
  },
};

export function MarkdownPreview({
  content,
  emptyTitle = "暂无内容",
  emptyDescription = "生成或选择内容后会在这里展示。",
}: MarkdownPreviewProps) {
  if (!content?.trim()) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="max-h-[680px] overflow-auto rounded-lg border bg-white p-5 text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
