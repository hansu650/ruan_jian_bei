import { BarChart3, ClipboardCheck, FileQuestion, FileText, Route, UserRound } from "lucide-react";
import Link from "next/link";

import { AppSidebar } from "@/components/app-sidebar";
import { FeatureCard } from "@/components/feature-card";
import { StageCard } from "@/components/stage-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CORE_FEATURES, PROJECT_STAGES } from "@/lib/constants";

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <AppSidebar />

        <div className="space-y-6">
          <section className="rounded-lg border bg-card p-6">
            <Badge variant="warning">第十阶段进行中</Badge>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">EduForge Dashboard</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              当前正在建设 A3 加分能力：学习效果评估。系统可生成测验、自动批改、分析薄弱点、
              更新掌握度并推荐补救资源，形成从画像到练习反馈的完整学习闭环。
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {CORE_FEATURES.map((feature) => (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                status={feature.status}
                description={feature.description}
              />
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                  练习测验
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-6 text-muted-foreground">
                  PracticeAgent 可基于学习路径 step、画像薄弱点和知识库片段生成单选、多选、简答和 SQL 实操题。
                </p>
                <Button asChild>
                  <Link href="/practice">进入练习测验</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
                  学习效果评估
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-6 text-muted-foreground">
                  EvaluatorAgent 会自动批改、输出错因分析、更新 LearnerProfile 掌握度，并生成评估报告。
                </p>
                <Button asChild variant="outline">
                  <Link href="/analytics">查看学习评估</Link>
                </Button>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserRound className="h-5 w-5 text-primary" aria-hidden="true" />
                  学习画像
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  画像提供薄弱点、偏好和掌握度，是测验生成与评估更新的基础。
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Route className="h-5 w-5 text-primary" aria-hidden="true" />
                  学习路径
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  测验绑定某个 LearningPathStep，便于评估当前阶段掌握情况。
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                  资源生成
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  评估后的补救建议会指向讲义、思维导图、实操案例和补救练习。
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileQuestion className="h-5 w-5 text-primary" aria-hidden="true" />
                  智能辅导
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  学生可以围绕错题和薄弱点继续向 TutorAgent 提问并查看引用来源。
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-3 md:grid-cols-2">
            {PROJECT_STAGES.map((stage) => (
              <StageCard
                key={stage.name}
                name={stage.name}
                description={stage.description}
                status={stage.status}
              />
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
