import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/v2/status-pill";

interface InnovationCardProps {
  index: number;
  title: string;
  value: string;
  proof: string[];
  href: string;
  icon: LucideIcon;
}

export function InnovationCard({ index, title, value, proof, href, icon: Icon }: InnovationCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <StatusPill>亮点 {index}</StatusPill>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{value}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {proof.map((item) => (
          <StatusPill key={item} tone="default">
            {item}
          </StatusPill>
        ))}
      </div>
      <Button asChild variant="outline" size="sm" className="mt-4">
        <Link href={href}>查看对应页面</Link>
      </Button>
    </article>
  );
}
