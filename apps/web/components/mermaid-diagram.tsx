"use client";

import { useEffect, useId, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderChart() {
      setSvg(null);
      setError(null);
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "default",
        });
        const result = await mermaid.render(`eduforge-mermaid-${id}`, chart);
        if (!cancelled) {
          setSvg(result.svg);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "图表渲染失败");
        }
      }
    }

    void renderChart();
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-800">图表渲染失败，可查看源码。</p>
        <pre className="mt-3 overflow-auto rounded-md bg-white p-3 text-xs leading-5 text-slate-700">
          {chart}
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-500">
        正在渲染思维导图...
      </div>
    );
  }

  return (
    <div
      className="overflow-auto rounded-lg border bg-white p-4"
      // Mermaid returns an SVG string. securityLevel=strict is enabled above.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
