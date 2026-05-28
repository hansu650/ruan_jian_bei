import { ArrowRight, FileText, Milestone, Route, UserRound } from "lucide-react";
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
              <Badge variant="warning">Phase 8</Badge>
              <h1 className="mt-3 text-3xl font-bold">Dashboard 骨架</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                当前正在建设 A3 核心能力之一：多类型学习资源生成。ResourceAgent 会根据画像、
                学习路径步骤和知识库引用片段生成讲义、思维导图、练习题、拓展阅读、实操案例和视频脚本。
              </p>
            </div>
            <Button asChild>
              <Link href="/resources">
                <FileText className="h-4 w-4" aria-hidden="true" />
                进入资源生成
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
                ProfileAgent 支持 8 维画像生成和持续更新，是路径规划和资源生成的主要输入。
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
              <Badge variant="success">已完成</Badge>
              <p className="text-sm text-muted-foreground">
                PlannerAgent 可生成 7 天左右学习路径，并检查 JOIN、事务、索引等薄弱点覆盖情况。
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/learning-path">
                  查看路径
                  <Route className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">资源生成</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge variant="warning">进行中</Badge>
              <p className="text-sm text-muted-foreground">
                ResourceAgent 正在生成 6 类个性化学习资源，并记录 citations_json 引用来源。
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/resources">
                  生成资源
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">智能辅导</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">待开始</Badge>
              <p className="mt-3 text-sm text-muted-foreground">
                TutorAgent、测验批改和学习效果评估将在后续阶段实现。
              </p>
            </CardContent>
          </Card>
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
              <Progress value={80} />
              <p className="text-sm text-muted-foreground">
                前七阶段已完成，第八阶段正在补齐 ResourceAgent，为后续 TutorAgent、PracticeAgent
                和 EvaluatorAgent 做准备。
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
