import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  MessageCircleQuestion,
  Route,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { AgentFlowCard } from "@/components/agent-flow-card";
import { AppSidebar } from "@/components/app-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const agents = [
  {
    name: "ProfileAgent",
    title: "学习画像智能体",
    role: "从学生自然语言中提取学习目标、基础、偏好和薄弱点。",
    input: "学生对话、课程信息、历史画像",
    output: "8 维学习画像",
    data: "LearnerProfile / ProfileChatMessage",
    next: "PlannerAgent",
    href: "/profile",
    icon: UserRound,
  },
  {
    name: "PlannerAgent",
    title: "路径规划智能体",
    role: "根据画像和课程知识点安排阶段化学习顺序。",
    input: "学习画像、课程、知识点",
    output: "个性化学习路径",
    data: "LearningPath / LearningPathStep",
    next: "ResourceAgent",
    href: "/learning-path",
    icon: Route,
  },
  {
    name: "ResourceAgent",
    title: "资源生成智能体",
    role: "围绕学习步骤生成讲义、导图、练习、阅读、实操和视频脚本。",
    input: "路径步骤、画像、课程知识库 chunk",
    output: "6 类个性化资源",
    data: "GeneratedResource",
    next: "TutorAgent / PracticeAgent",
    href: "/resources",
    icon: FileText,
  },
  {
    name: "TutorAgent",
    title: "智能辅导智能体",
    role: "基于课程知识库回答学生问题，并展示引用来源。",
    input: "学生问题、知识库检索结果、学习画像",
    output: "带来源的辅导回答",
    data: "TutorSession / TutorMessage",
    next: "PracticeAgent",
    href: "/tutor",
    icon: MessageCircleQuestion,
  },
  {
    name: "PracticeAgent",
    title: "练习生成智能体",
    role: "结合学习步骤和薄弱点生成多题型测验。",
    input: "学习步骤、画像、知识库 chunk",
    output: "单选、多选、简答、SQL 实操",
    data: "PracticeQuiz / PracticeQuestion",
    next: "EvaluatorAgent",
    href: "/practice",
    icon: ClipboardCheck,
  },
  {
    name: "EvaluatorAgent",
    title: "学习评估智能体",
    role: "自动批改答案，分析错因，更新掌握度并生成学习报告。",
    input: "学生答案、标准答案、画像",
    output: "得分、错因、掌握度变化、补救建议",
    data: "PracticeAttempt / LearningEvaluationReport",
    next: "ProfileAgent",
    href: "/analytics",
    icon: CheckCircle2,
  },
  {
    name: "CitationVerifier",
    title: "引用校验器",
    role: "检查回答或资源是否有引用来源，并识别版权风险。",
    input: "生成内容、citations_json、学生问题",
    output: "有来源 / 需教师确认 / 不适合处理",
    data: "citations_json / safety_status",
    next: "TutorAgent / ResourceAgent",
    href: "/tutor",
    icon: ShieldCheck,
  },
];

const loop = ["画像", "路径", "资源", "辅导", "测验", "评估", "更新画像"];

export default function AgentsFlowPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <AppSidebar />

        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <Badge variant="secondary">智能体协作</Badge>
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  多智能体协作流程
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                  EduForge 不是单一聊天机器人，而是把画像、路径、资源、答疑、练习和评估拆成多个专业智能体。
                  每个智能体负责一个清晰环节，数据在数据库中沉淀，形成可继续学习的闭环。
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button asChild className="bg-sky-700 hover:bg-sky-800">
                    <Link href="/learn">回到学习工作台</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/innovation">查看创新亮点</Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-sky-700 shadow-sm">
                    <Bot className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-950">自研轻量多智能体流水线</p>
                    <p className="text-sm text-slate-600">不依赖 CrewAI / LangGraph，当前实现以服务层和 Agent 类组织。</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
                  {loop.map((item, index) => (
                    <div key={item} className="flex items-center gap-2">
                      <span className="rounded-full border border-sky-200 bg-white px-3 py-1 font-medium text-sky-800">
                        {item}
                      </span>
                      {index < loop.length - 1 ? (
                        <ArrowRight className="h-4 w-4 text-sky-500" aria-hidden="true" />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {agents.map((agent) => (
              <AgentFlowCard key={agent.name} {...agent} />
            ))}
          </section>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>数据如何在智能体之间流转</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-3">
              {[
                ["学生输入", "学习目标、时间、基础和偏好先进入学习画像，后续模块不需要学生重复说明。"],
                ["课程知识", "原创课程资料被分块检索，资源和答疑通过 citations_json 记录来源。"],
                ["学习反馈", "测验结果会沉淀为掌握度变化和补救建议，让下一轮学习更有方向。"],
              ].map(([title, description]) => (
                <div key={title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-950">{title}</p>
                  <p className="mt-2 leading-6 text-slate-600">{description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>和赛题要求的对应关系</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2">
              {[
                ["对话式学习画像", "ProfileAgent 生成并持续更新 8 维学习画像。"],
                ["个性化学习路径", "PlannerAgent 根据画像和课程知识点生成阶段化路径。"],
                ["多类型资源生成", "ResourceAgent 生成 6 类学习资料并保存引用来源。"],
                ["智能辅导", "TutorAgent 基于课程知识库提供带来源答疑。"],
                ["学习效果评估", "PracticeAgent 与 EvaluatorAgent 完成测验、批改和掌握度更新。"],
                ["防幻觉机制", "CitationVerifier 和 citations_json 提醒来源不足或版权风险。"],
              ].map(([title, description]) => (
                <div key={title} className="rounded-lg border bg-slate-50 p-4">
                  <p className="font-semibold text-slate-950">{title}</p>
                  <p className="mt-2 leading-6 text-slate-600">{description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
