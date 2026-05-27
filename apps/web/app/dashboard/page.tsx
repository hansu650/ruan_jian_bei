import { ArrowRight, LibraryBig, Milestone } from "lucide-react";
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
              <Badge variant="warning">Phase 4</Badge>
              <h1 className="mt-3 text-3xl font-bold">Dashboard 骨架</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                当前已完成数据底座，正在建设课程资料解析、分块和基础检索能力。
              </p>
            </div>
            <Button asChild>
              <Link href="/knowledge-base">
                <LibraryBig className="h-4 w-4" aria-hidden="true" />
                进入知识库
              </Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {CORE_FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">数据库模型与基础 CRUD</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge variant="success">已完成</Badge>
              <p className="text-sm text-muted-foreground">
                SQLite + SQLModel 已接入，用于课程、学生、知识点、画像草稿和资源占位。
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/database">
                  进入数据底座
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">课程知识库</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge variant="warning">进行中</Badge>
              <p className="text-sm text-muted-foreground">
                正在建设原创课程资料导入、Markdown/TXT 解析、文本分块和关键词检索。
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/knowledge-base">
                  查看知识库
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          {["LLM Provider", "学习画像"].map((title) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline">待开始</Badge>
                <p className="mt-3 text-sm text-muted-foreground">
                  当前只预留数据结构，正式能力将在后续阶段实现。
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
              <Progress value={40} />
              <p className="text-sm text-muted-foreground">
                第一至三阶段已完成，第四阶段正在补齐课程资料解析、分块和基础检索。
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
