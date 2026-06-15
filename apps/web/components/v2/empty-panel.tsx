import Link from "next/link";

import { Button } from "@/components/ui/button";

interface EmptyPanelProps {
  title: string;
  description: string;
  actionLabel?: string;
  href?: string;
}

export function EmptyPanel({ title, description, actionLabel, href }: EmptyPanelProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      {actionLabel && href ? (
        <Button asChild className="mt-4 bg-sky-700 hover:bg-sky-800">
          <Link href={href}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
