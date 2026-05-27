"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Server } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE_URL, getHealth, getMeta } from "@/lib/api";
import type { HealthResponse, MetaResponse } from "@/lib/types";

type Loadable<T> =
  | { state: "loading" }
  | { state: "success"; data: T }
  | { state: "error"; message: string };

export default function HealthPage() {
  const [health, setHealth] = useState<Loadable<HealthResponse>>({ state: "loading" });
  const [meta, setMeta] = useState<Loadable<MetaResponse>>({ state: "loading" });

  useEffect(() => {
    void getHealth()
      .then((data) => setHealth({ state: "success", data }))
      .catch((error) =>
        setHealth({
          state: "error",
          message: error instanceof Error ? error.message : "Health 请求失败",
        }),
      );

    void getMeta()
      .then((data) => setMeta({ state: "success", data }))
      .catch((error) =>
        setMeta({
          state: "error",
          message: error instanceof Error ? error.message : "Meta 请求失败",
        }),
      );
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Badge variant="secondary">前后端联调</Badge>
        <h1 className="mt-3 text-3xl font-bold">Health Check</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          这里直接从浏览器请求后端，不经过 Next.js API route 转发。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
              <CardTitle className="text-base">前端运行状态</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4 rounded-md border bg-background px-3 py-2">
              <span>Next.js App Router</span>
              <Badge variant="success">running</Badge>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-md border bg-background px-3 py-2">
              <span>API Base URL</span>
              <span className="break-all text-right text-muted-foreground">{API_BASE_URL}</span>
            </div>
          </CardContent>
        </Card>

        <StatusPanel title="/api/health" data={health} />
        <StatusPanel title="/api/meta" data={meta} wide />
      </div>
    </div>
  );
}

function StatusPanel<T>({ title, data, wide = false }: { title: string; data: Loadable<T>; wide?: boolean }) {
  return (
    <Card className={wide ? "md:col-span-2" : undefined}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.state === "loading" && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {data.state === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>请求失败</AlertTitle>
            <AlertDescription>{data.message}</AlertDescription>
          </Alert>
        )}

        {data.state === "success" && (
          <>
            <div className="flex items-center gap-2">
              <Badge variant="success">ok</Badge>
              <span className="text-sm text-muted-foreground">后端接口返回成功</span>
            </div>
            <Separator />
            <pre className="max-h-[360px] overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-6 text-slate-50">
              {JSON.stringify(data.data, null, 2)}
            </pre>
          </>
        )}
      </CardContent>
    </Card>
  );
}
