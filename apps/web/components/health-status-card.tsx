"use client";

import { useEffect, useState } from "react";
import { Activity, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getHealth } from "@/lib/api";
import type { HealthResponse } from "@/lib/types";

type HealthState =
  | { status: "loading" }
  | { status: "success"; data: HealthResponse }
  | { status: "error"; message: string };

interface HealthStatusCardProps {
  compact?: boolean;
}

export function HealthStatusCard({ compact = false }: HealthStatusCardProps) {
  const [state, setState] = useState<HealthState>({ status: "loading" });

  async function loadHealth() {
    setState({ status: "loading" });
    try {
      const data = await getHealth();
      setState({ status: "success", data });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "后端状态请求失败",
      });
    }
  }

  useEffect(() => {
    void loadHealth();
  }, []);

  return (
    <Card>
      <CardHeader className={compact ? "pb-3" : undefined}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle className="text-base">后端健康状态</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={loadHealth} aria-label="刷新后端状态">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className={compact ? "space-y-3" : "space-y-4"}>
        {state.status === "loading" && (
          <div className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}

        {state.status === "success" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                {state.data.status}
              </Badge>
              <Badge variant="outline">{state.data.service}</Badge>
              <Badge variant="secondary">{state.data.stage}</Badge>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {state.data.project} 后端已连通，当前接口面向 {state.data.competition} 第二阶段联调。
            </p>
          </div>
        )}

        {state.status === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>后端暂未连通</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
