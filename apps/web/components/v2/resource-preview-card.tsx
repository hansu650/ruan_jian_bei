import { BookOpenText } from "lucide-react";

import { ResourceTypeBadge } from "@/components/resource-type-badge";
import { StatusPill } from "@/components/v2/status-pill";
import { cn } from "@/lib/utils";

interface ResourcePreviewCardProps {
  title: string;
  type: string;
  preview: string;
  citationCount: number;
  status: string;
  createdAt?: string;
  active?: boolean;
  onSelect: () => void;
}

export function ResourcePreviewCard({
  title,
  type,
  preview,
  citationCount,
  status,
  createdAt,
  active,
  onSelect,
}: ResourcePreviewCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-sky-200 hover:bg-sky-50/40",
        active ? "border-sky-300 bg-sky-50/70" : "border-slate-200",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
          <BookOpenText className="h-5 w-5" aria-hidden="true" />
        </span>
        <ResourceTypeBadge type={type} />
      </div>
      <h3 className="mt-4 line-clamp-2 text-sm font-semibold leading-6 text-slate-950">{title}</h3>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{preview || "已生成学习资料，点击查看正文。"}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <StatusPill tone={status === "needs_review" ? "warning" : "success"}>
          {status === "needs_review" ? "需教师确认" : "已保存"}
        </StatusPill>
        <span>{citationCount} 条来源</span>
        {createdAt ? <span>{new Date(createdAt).toLocaleDateString("zh-CN")}</span> : null}
      </div>
      <span className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition group-hover:border-sky-200 group-hover:text-sky-700">
        查看资料
      </span>
    </button>
  );
}
