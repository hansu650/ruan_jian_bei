import { ArrowRight, FileQuestion, FileText, Milestone, Route, UserRound } from "lucide-react";
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
              <Badge variant="warning">Phase 9</Badge>
              <h1 className="mt-3 text-3xl font-bold">Dashboard 骨架</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                当前正在建设 A3 可选加分能力：TutorAgent 智能辅导。系统会基于课程知识库 chunk
                回答学生问题，并通过 citations 和 CitationVerifier 降低幻觉风险。
              </p>
            </div>
            <Button asChild>
              <Link href="/tutor">
                <FileQuestion className="h-4 w-4" aria-hidden="true" />
                进入智能辅导
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
                ProfileAgent 支持 8 维画像生成和持续更新，是路径规划、资源生成和辅导个性化的输入。
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
              <Badge variant="success">已完成</Badge>
              <p className="text-sm text-muted-foreground">
                ResourceAgent 能生成 6 类个性化学习资源，并记录 citations_json 引用来源。
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/resources">
                  查看资源
                  <FileText className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">智能辅导</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge variant="warning">进行中</Badge>
              <p className="text-sm text-muted-foreground">
                TutorAgent 正在支持带引用来源的课程问答，并展示安全状态与质量检查。
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/tutor">
                  开始提问
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
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
              <Progress value={90} />
              <p className="text-sm text-muted-foreground">
                前八阶段已完成，第九阶段聚焦 TutorAgent、CitationVerifier、TutorSession 和 TutorMessage。
                自动批改、学习效果评估和掌握度动态更新仍留到第十阶段。
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
