import {
  BarChart3,
  ClipboardCheck,
  FileQuestion,
  FileText,
  MonitorPlay,
  Route,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { AppSidebar } from "@/components/app-sidebar";
import { FeatureCard } from "@/components/feature-card";
import { StageCard } from "@/components/stage-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CORE_FEATURES, PROJECT_STAGES } from "@/lib/constants";

const entryCards = [
  {
    title: "演示工作台",
    description: "比赛演示前先进入 /demo，检查基础数据、知识库、画像、路径、资源、辅导、测验和评估状态。",
    href: "/demo",
    icon: MonitorPlay,
    primary: true,
  },
  {
    title: "学习画像",
    description: "用自然语言生成 8 维动态画像，为后续路径和资源个性化提供基础。",
    href: "/profile",
    icon: UserRound,
  },
  {
    title: "学习路径",
    description: "根据画像和知识点生成阶段化路径，推荐资源类型但不重复生成资源正文。",
    href: "/learning-path",
    icon: Route,
  },
  {
    title: "资源生成",
    description: "选择学习路径步骤，生成讲义、思维导图、练习题、阅读、实操案例和视频脚本。",
    href: "/resources",
    icon: FileText,
  },
  {
    title: "智能辅导",
    description: "基于知识库 chunk 回答数据库问题，并展示 citations 和防幻觉状态。",
    href: "/tutor",
    icon: FileQuestion,
  },
  {
    title: "练习与评估",
    description: "生成测验、提交答案、自动批改并在学习评估页查看掌握度更新。",
    href: "/practice",
    icon: ClipboardCheck,
  },
];

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <AppSidebar />

        <div className="space-y-6">
          <section className="rounded-lg border bg-card p-6">
            <Badge variant="warning">Phase 11 进行中</Badge>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">EduForge Dashboard</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              当前进入端到端演示工作台与稳定性打磨阶段。前十阶段和 Phase 10.1 已形成完整学习闭环，
              本阶段重点是让比赛演示更可控：先检查状态，再按步骤人工触发关键能力。
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

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {entryCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title} className={card.primary ? "border-primary/40" : undefined}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm leading-6 text-muted-foreground">{card.description}</p>
                    <Button asChild variant={card.primary ? "default" : "outline"} size="sm">
                      <Link href={card.href}>进入</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
                  学习评估
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-6 text-muted-foreground">
                  查看测验次数、平均准确率、最新掌握度、薄弱点和评估报告。
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/analytics">查看</Link>
                </Button>
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
