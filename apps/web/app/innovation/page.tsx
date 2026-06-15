import {
  BookOpenText,
  Bot,
  Brain,
  CheckCircle2,
  FileStack,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { AppSidebar } from "@/components/app-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const innovations = [
  {
    title: "画像驱动的个性化学习闭环",
    description: "学生通过自然语言生成 8 维画像，画像会影响路径、资源、测验和评估，并可随反馈更新。",
    proof: ["专业背景", "学习目标", "知识基础", "学习偏好", "薄弱点", "掌握度"],
    icon: Brain,
  },
  {
    title: "可信课程知识库与引用来源",
    description: "使用团队原创《数据库系统》资料，完成文档解析、分块、检索和 citations_json 引用记录。",
    proof: ["原创资料", "文档分块", "关键词检索", "引用片段", "来源文件"],
    icon: BookOpenText,
  },
  {
    title: "多智能体学习流水线",
    description: "ProfileAgent、PlannerAgent、ResourceAgent、TutorAgent、PracticeAgent、EvaluatorAgent 按学习环节协作。",
    proof: ["画像", "路径", "资源", "辅导", "测验", "评估"],
    icon: Bot,
  },
  {
    title: "六类个性化学习资源生成",
    description: "围绕学习路径步骤生成讲义、思维导图、练习题、拓展阅读、SQL 实操和视频脚本。",
    proof: ["讲义", "思维导图", "练习题", "拓展阅读", "实操案例", "视频脚本"],
    icon: FileStack,
  },
  {
    title: "轻量掌握度追踪与学习效果评估",
    description: "自动批改后生成错因分析、掌握度变化、补救建议和学习评估报告。",
    proof: ["自动批改", "错因分析", "掌握度更新", "补救建议", "评估报告"],
    icon: CheckCircle2,
  },
  {
    title: "Mock / Spark 双模式",
    description: "Mock 保证离线开发和自动化测试稳定，Spark HTTP Provider 支持本地可选接入讯飞星火 Lite。",
    proof: ["默认 Mock", "可选 Spark", "测试不联网", "密钥不进前端", "无 Key 可演示"],
    icon: Sparkles,
  },
  {
    title: "引用来源防幻觉与版权边界",
    description: "回答和资源尽量带课程来源；来源不足时提示教师确认，版权风险请求会被提醒或拒绝。",
    proof: ["有来源", "需教师确认", "不适合处理", "不复制教材原文"],
    icon: ShieldCheck,
  },
];

const notClaimed = [
  "未声明已实现完整 BKT 算法，仅实现轻量掌握度追踪，后续可扩展。",
  "未声明已实现情感识别、费曼学习法、多 Agent 对抗辩论或成就系统。",
  "未声明已接入 CrewAI、LangGraph 或复杂调度平台，当前是自研轻量 Agent 流水线。",
  "未内置真实 API Key，真实 Spark 仅允许本地可选配置。",
];

export default function InnovationPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <AppSidebar />

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <Badge variant="secondary">比赛亮点</Badge>
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  创新亮点
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                  这里把 EduForge 已经实现的能力整理成评委易懂的产品亮点。
                  我们只包装真实功能，不把未实现的算法或系统写成已完成。
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button asChild className="bg-sky-700 hover:bg-sky-800">
                    <Link href="/agents-flow">查看智能体协作</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/learn">进入学习工作台</Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-5">
                <Layers3 className="h-8 w-8 text-sky-700" aria-hidden="true" />
                <p className="mt-4 font-semibold text-slate-950">一句话概括</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  EduForge 用“画像驱动 + 可信知识库 + 多智能体流水线”把课程学习拆成可执行、可追踪、可解释的个性化学习闭环。
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            {innovations.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <Badge variant="outline">创新点 {index + 1}</Badge>
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-7 text-slate-600">{item.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {item.proof.map((proof) => (
                        <Badge key={proof} variant="secondary">
                          {proof}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>

          <Card className="border-amber-200 bg-amber-50/60">
            <CardHeader>
              <CardTitle className="text-lg">不虚假宣传边界</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 text-sm leading-6 text-amber-950 md:grid-cols-2">
                {notClaimed.map((item) => (
                  <li key={item} className="rounded-lg border border-amber-200 bg-white/70 p-3">
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
