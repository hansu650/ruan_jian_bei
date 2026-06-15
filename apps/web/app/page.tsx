import { ArrowRight, BookOpenCheck, Brain, FileCheck2, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/v2/page-container";
import { PageHero } from "@/components/v2/page-hero";
import { SectionCard } from "@/components/v2/section-card";
import { StatusPill } from "@/components/v2/status-pill";

const highlights = [
  {
    title: "对话生成学习画像",
    description: "从学生自然语言中整理基础、目标、时间和薄弱点，让后续学习不再从零开始。",
    icon: Brain,
  },
  {
    title: "个性化路径与学习资源",
    description: "围绕《数据库系统》生成可执行路径，并为每个步骤准备讲义、导图、练习和实操。",
    icon: BookOpenCheck,
  },
  {
    title: "带引用来源的答疑和评估",
    description: "辅导回答和学习资源尽量关联课程知识库来源，测验后给出掌握度变化和补救建议。",
    icon: ShieldCheck,
  },
];

const loop = ["画像", "路径", "资源", "答疑", "练习", "评估"];

export default function HomePage() {
  return (
    <PageContainer className="space-y-8">
      <PageHero
        eyebrow="第十五届中国软件杯 A3"
        title="EduForge 智学工坊"
        description="面向高校课程的 AI 个性化学习助手。先了解你的学习情况，再为你规划路径、生成资料、答疑、出题和评估。"
        actions={
          <>
            <Button asChild size="lg" className="bg-sky-700 hover:bg-sky-800">
              <Link href="/learn">
                进入学习工作台
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/demo">查看演示工作台</Link>
            </Button>
          </>
        }
        aside={
          <div className="rounded-3xl border border-sky-100 bg-sky-50/70 p-5">
            <Sparkles className="h-8 w-8 text-sky-700" aria-hidden="true" />
            <p className="mt-4 text-sm font-medium text-slate-950">学习闭环</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              学习画像驱动路径，路径驱动资源和练习，测验反馈再回到掌握度和下一步建议。
            </p>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <SectionCard key={item.title}>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-slate-950">{item.title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
            </SectionCard>
          );
        })}
      </section>

      <SectionCard>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">一条学生能走完的学习路线</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              EduForge 把 A3 赛题中的画像、路径、资源、辅导、练习和评估组织成连续学习旅程。
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/agents-flow">查看智能体协作</Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {loop.map((item, index) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-sky-700">0{index + 1}</p>
              <p className="mt-2 font-medium text-slate-950">{item}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard>
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-sky-700" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-slate-950">可信学习资料基础</h2>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              系统使用原创课程资料和自建知识库，资源与答疑会保留引用来源，不复制出版教材原文。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill tone="success">自建课程知识库</StatusPill>
            <StatusPill tone="active">引用来源</StatusPill>
            <StatusPill tone="warning">Spark Lite 可选</StatusPill>
            <StatusPill>Mock / Spark 双模式</StatusPill>
          </div>
        </div>
      </SectionCard>
    </PageContainer>
  );
}
