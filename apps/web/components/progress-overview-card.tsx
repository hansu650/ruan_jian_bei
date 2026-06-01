import { Card, CardContent } from "@/components/ui/card";

interface ProgressOverviewItem {
  label: string;
  value: string;
  helper: string;
}

interface ProgressOverviewCardProps {
  items: ProgressOverviewItem[];
}

export function ProgressOverviewCard({ items }: ProgressOverviewCardProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="border-slate-200 bg-white">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</p>
            <p className="mt-2 text-sm leading-5 text-slate-500">{item.helper}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
