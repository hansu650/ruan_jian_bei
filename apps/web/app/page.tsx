import { ArrowRight, CheckCircle2, LayoutDashboard } from "lucide-react";
import Link from "next/link";

import { HealthStatusCard } from "@/components/health-status-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  APP_NAME,
  APP_SUBTITLE,
  COMPANY_NAME,
  COMPETITION_NAME,
  COMPETITION_TRACK,
  CORE_LOOP,
  PROJECT_POSITIONING,
} from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{COMPETITION_NAME}</Badge>
            <Badge variant="outline">{COMPETITION_TRACK} 赛题</Badge>
            <Badge variant="warning">第二阶段：前端骨架与前后端联调</Badge>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold sm:text-5xl">{APP_NAME}</h1>
            <p className="max-w-3xl text-xl text-muted-foreground">{APP_SUBTITLE}</p>
            <p className="max-w-3xl text-base leading-7">{PROJECT_POSITIONING}</p>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg border bg-card p-4">
              <p className="font-semibold">赛题</p>
              <p className="mt-1 text-muted-foreground">第十五届中国软件杯 A3</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="font-semibold">出题企业</p>
              <p className="mt-1 text-muted-foreground">{COMPANY_NAME}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                进入 Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/health">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                查看 Health Check
              </Link>
            </Button>
          </div>
        </div>

        <HealthStatusCard compact />
      </section>

      <Separator className="my-10" />

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">核心闭环</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            当前仅展示产品骨架，正式业务能力将在后续阶段逐步接入。
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">A3 个性化学习闭环设计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              {CORE_LOOP.map((item, index) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="rounded-md border bg-background px-3 py-2 text-sm font-medium">
                    {item}
                  </span>
                  {index < CORE_LOOP.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
