import { ArrowRight, Milestone, Route, UserRound } from "lucide-react";
import Link from "next/link";

import { AppSidebar } from "@/components/app-sidebar";
import { FeatureCard } from "@/components/feature-card";
import { StageCard } from "@/components/stage-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
              <Badge variant="warning">Phase 7</Badge>
              <h1 className="mt-3 text-3xl font-bold">Dashboard 骨架</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                当前正在建设 A3 核心能力之一：个性化学习路径规划，系统会根据画像和课程知识点生成阶段化学习计划，并推荐资源类型。
              </p>
            </div>
            <Button asChild>
              <Link href="/learning-path">
                <Route className="h-4 w-4" aria-hidden="true" />
                进入学习路径
              </Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {CORE_FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">学习画像</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge variant="success">已完成</Badge>
              <p className="text-sm text-muted-foreground">
                ProfileAgent 已支持 8 维画像生成和持续更新，是路径规划的主要输入。
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/profile">
                  查看学习画像
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">学习路径</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge variant="warning">进行中</Badge>
              <p className="text-sm text-muted-foreground">
                PlannerAgent 可生成 7 天左右学习路径，并检查 JOIN、事务、索引等薄弱点覆盖情况。
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/learning-path">
                  生成路径
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          {["资源生成", "智能辅导"].map((title) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline">待开始</Badge>
                <p className="mt-3 text-sm text-muted-foreground">
                  后续阶段再实现，不在当前阶段提前展开。
                </p>
              </CardContent>
            </Card>
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
              <Progress value={70} />
              <p className="text-sm text-muted-foreground">
                前六阶段已完成，第七阶段正在补齐 PlannerAgent，为第八阶段 ResourceAgent 做准备。
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
