import { ArrowRight, BookOpenCheck, Bot, Brain, Lightbulb, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const highlights = [
  {
    title: "从学习画像开始",
    description: "用自然语言说明基础、目标和偏好，系统生成个性化学习画像。",
    icon: Brain,
  },
  {
    title: "沿着路径小步推进",
    description: "把数据库系统拆成可执行的学习步骤，明确今天先学什么。",
    icon: BookOpenCheck,
  },
  {
    title: "回答带课程来源",
    description: "辅导回答尽量引用课程知识库片段，降低空泛解释和幻觉风险。",
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">第十五届中国软件杯 A3</Badge>
            <Badge variant="outline">高校课程学习场景</Badge>
          </div>
          <div className="space-y-4">
            <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              EduForge 智学工坊
            </h1>
            <p className="max-w-3xl text-xl leading-8 text-slate-600">
              面向《数据库系统》的个性化 AI 学习平台：从画像、路径、资源到练习评估，
              帮学生知道自己该学什么、怎么学、学得怎么样。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-sky-700 hover:bg-sky-800">
              <Link href="/learn">
                进入学习工作台
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/demo">查看演示准备</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/agents-flow">了解智能体协作</Link>
            </Button>
          </div>
        </div>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="space-y-5 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <Sparkles className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-950">一条完整的学习闭环</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                画像生成、个性化路径、课程资料生成、带来源答疑、练习批改和学习诊断都围绕同一门课程展开。
              </p>
            </div>
            <div className="grid gap-3 text-sm">
              {["学习画像", "学习路径", "学习资源", "智能辅导", "练习测验", "学习评估"].map(
                (item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-xs font-semibold text-sky-700">
                      {index + 1}
                    </span>
                    <span className="font-medium text-slate-800">{item}</span>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="border-slate-200 bg-white">
              <CardContent className="p-5">
                <Icon className="h-5 w-5 text-sky-700" aria-hidden="true" />
                <h3 className="mt-4 font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="mt-12 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="border-slate-200 bg-white">
          <CardContent className="flex h-full flex-col gap-4 p-6">
            <Bot className="h-6 w-6 text-sky-700" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-semibold text-slate-950">多智能体学习流水线</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                画像、路径、资源、辅导、练习和评估由不同智能体分工完成，方便评委理解系统不是单点聊天。
              </p>
            </div>
            <Button asChild variant="outline" className="mt-auto w-fit">
              <Link href="/agents-flow">查看协作流程</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="flex h-full flex-col gap-4 p-6">
            <Lightbulb className="h-6 w-6 text-sky-700" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-semibold text-slate-950">真实能力包装成创新亮点</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                画像驱动闭环、可信知识库、六类资源、引用来源和轻量掌握度追踪，都能在系统中找到对应页面和数据。
              </p>
            </div>
            <Button asChild variant="outline" className="mt-auto w-fit">
              <Link href="/innovation">查看创新亮点</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
