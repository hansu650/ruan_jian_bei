import { Database, Milestone } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { FeatureCard } from "@/components/feature-card";
import { StageCard } from "@/components/stage-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CORE_FEATURES, PROJECT_STAGES } from "@/lib/constants";

export default function DashboardPage() {
  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
      <AppSidebar />

      <div className="space-y-6">
        <section className="rounded-lg border bg-card p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Badge variant="warning">Phase 2</Badge>
              <h1 className="mt-3 text-3xl font-bold">Dashboard 骨架</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                当前只展示比赛演示结构，正式学习业务将在后续阶段接入。
              </p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" aria-hidden="true" />
                <span className="text-sm font-semibold">当前课程：数据库系统</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">状态：后续阶段接入</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <FeatureCard
            title="当前课程"
            status="后续阶段接入"
            description="后续将以《数据库系统》作为第一门示例课程知识库。"
          />
          {CORE_FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </section>

        <section className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Milestone className="h-5 w-5 text-primary" aria-hidden="true" />
                <CardTitle className="text-base">阶段进度</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={20} />
              <p className="text-sm text-muted-foreground">
                第一阶段已完成，第二阶段正在完成前端骨架与前后端联调。
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-3 md:grid-cols-2">
            {PROJECT_STAGES.map((stage) => (
              <StageCard key={stage.name} {...stage} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
