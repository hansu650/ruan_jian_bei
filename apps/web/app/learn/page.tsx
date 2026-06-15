"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ClipboardCheck,
  FileText,
  MessageCircleQuestion,
  Route,
  Target,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { LoadingState } from "@/components/loading-state";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ErrorPanel } from "@/components/v2/error-panel";
import { LearningStepCard } from "@/components/v2/learning-step-card";
import { LearningTaskCard } from "@/components/v2/learning-task-card";
import { PageContainer } from "@/components/v2/page-container";
import { SectionCard } from "@/components/v2/section-card";
import { StatCard } from "@/components/v2/stat-card";
import { StatusPill } from "@/components/v2/status-pill";
import {
  getDemoStatus,
  getGeneratedResources,
  getCourses,
  getLearningAnalytics,
  getLearningPath,
  getLearningPaths,
  getPracticeAttempts,
  getProfileSummary,
  getStudents,
} from "@/lib/api";
import type {
  Course,
  DemoStatusResponse,
  GeneratedResource,
  LearningAnalyticsSummary,
  LearningPath,
  LearningPathStep,
  LearnerProfile,
  PracticeAttempt,
  ProfileSummaryResponse,
  Student,
} from "@/lib/types";

interface LearnSnapshot {
  demo: DemoStatusResponse;
  profileSummary: ProfileSummaryResponse | null;
  paths: LearningPath[];
  steps: LearningPathStep[];
  resources: GeneratedResource[];
  attempts: PracticeAttempt[];
  analytics: LearningAnalyticsSummary | null;
  student: Student | null;
  course: Course | null;
}

function parseJsonArray(value?: string | null): string[] {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function parseMastery(value?: string | null): Record<string, number> {
  if (!value) {
    return {};
  }
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed)
        .map(([key, raw]) => [key, Number(raw)])
        .filter(([, raw]) => Number.isFinite(raw)),
    );
  } catch {
    return {};
  }
}

function formatPercent(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "暂无";
  }
  return `${Math.round(value * 100)}%`;
}

function getNextAction(snapshot: LearnSnapshot) {
  const hasKnowledgeBase = snapshot.demo.steps.some(
    (step) =>
      (step.key.includes("knowledge") || step.title.includes("知识库")) &&
      step.status !== "missing",
  );
  const profile = snapshot.profileSummary?.profile;

  if (!hasKnowledgeBase) {
    return { href: "/knowledge-base", label: "准备课程资料" };
  }
  if (!profile) {
    return { href: "/profile", label: "生成学习画像" };
  }
  if (snapshot.steps.length === 0) {
    return { href: "/learning-path", label: "生成学习路径" };
  }
  if (snapshot.resources.length === 0) {
    return { href: "/resources", label: "生成学习资料" };
  }
  if (snapshot.attempts.length === 0) {
    return { href: "/practice", label: "完成一次小测" };
  }
  return { href: "/analytics", label: "查看学习诊断" };
}

export default function LearnPage() {
  const [snapshot, setSnapshot] = useState<LearnSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const demo = await getDemoStatus();
      const studentId = demo.student_id;
      const courseId = demo.course_id;

      let profileSummary: ProfileSummaryResponse | null = null;
      let paths: LearningPath[] = [];
      let steps: LearningPathStep[] = [];
      let resources: GeneratedResource[] = [];
      let attempts: PracticeAttempt[] = [];
      let analytics: LearningAnalyticsSummary | null = null;
      let student: Student | null = null;
      let course: Course | null = null;

      if (studentId && courseId) {
        const [studentResult, courseResult, profileResult, pathsResult, resourcesResult, attemptsResult, analyticsResult] =
          await Promise.allSettled([
            getStudents(),
            getCourses(),
            getProfileSummary(studentId, courseId),
            getLearningPaths({ student_id: studentId, course_id: courseId }),
            getGeneratedResources({ student_id: studentId, course_id: courseId }),
            getPracticeAttempts({ student_id: studentId, course_id: courseId }),
            getLearningAnalytics(studentId, courseId),
          ]);

        student =
          studentResult.status === "fulfilled"
            ? studentResult.value.find((item) => item.id === studentId) ?? null
            : null;
        course =
          courseResult.status === "fulfilled"
            ? courseResult.value.find((item) => item.id === courseId) ?? null
            : null;
        profileSummary = profileResult.status === "fulfilled" ? profileResult.value : null;
        paths = pathsResult.status === "fulfilled" ? pathsResult.value : [];
        resources = resourcesResult.status === "fulfilled" ? resourcesResult.value : [];
        attempts = attemptsResult.status === "fulfilled" ? attemptsResult.value : [];
        analytics = analyticsResult.status === "fulfilled" ? analyticsResult.value : null;

        const latestPath = [...paths].sort((a, b) => b.id - a.id)[0];
        if (latestPath) {
          const detail = await getLearningPath(latestPath.id).catch(() => null);
          steps = detail?.steps ?? [];
        }
      }

      setSnapshot({ demo, profileSummary, paths, steps, resources, attempts, analytics, student, course });
    } catch (err) {
      setError(err instanceof Error ? err.message : "学习工作台暂时无法加载。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const derived = useMemo(() => {
    if (!snapshot) {
      return null;
    }

    const profile: LearnerProfile | null = snapshot.profileSummary?.profile ?? null;
    const nextAction = getNextAction(snapshot);
    const todayStep =
      snapshot.steps.find((step) => step.status !== "completed") ?? snapshot.steps[0] ?? null;
    const weakPoints = profile ? parseJsonArray(profile.weak_points_json) : [];
    const mastery =
      snapshot.analytics?.latest_mastery_json !== undefined
        ? parseMastery(snapshot.analytics.latest_mastery_json)
        : parseMastery(profile?.mastery_json);

    const overviewItems = [
      {
        label: "学习画像",
        value: profile ? "已完成" : "未完成",
        helper: profile ? `第 ${profile.version} 版画像` : "先告诉系统你的基础和目标",
        icon: UserRound,
        tone: profile ? ("success" as const) : ("warning" as const),
      },
      {
        label: "学习路径",
        value: snapshot.steps.length > 0 ? `${snapshot.steps.length} 步` : "未生成",
        helper: snapshot.paths[0]?.title ?? "生成后会安排每日学习顺序",
        icon: Route,
        tone: snapshot.steps.length > 0 ? ("success" as const) : ("default" as const),
      },
      {
        label: "学习资料",
        value: `${snapshot.resources.length} 个`,
        helper: "讲义、思维导图、练习题等资料",
        icon: FileText,
        tone: snapshot.resources.length > 0 ? ("success" as const) : ("default" as const),
      },
      {
        label: "练习结果",
        value: snapshot.analytics
          ? formatPercent(snapshot.analytics.average_accuracy)
          : `${snapshot.attempts.length} 次`,
        helper: snapshot.analytics ? "平均准确率" : "完成小测后会出现诊断",
        icon: Target,
        tone: snapshot.attempts.length > 0 ? ("success" as const) : ("default" as const),
      },
    ];

    const journey = [
      {
        title: "学习画像",
        description: "告诉系统你的基础、目标、薄弱点和学习偏好。",
        href: "/profile",
        icon: UserRound,
        status: profile ? "done" : "active",
        actionLabel: profile ? "查看画像" : "开始画像",
      },
      {
        title: "学习路径",
        description: "生成一条适合当前目标的数据库学习计划。",
        href: "/learning-path",
        icon: Route,
        status: snapshot.steps.length > 0 ? "done" : profile ? "active" : "todo",
        actionLabel: snapshot.steps.length > 0 ? "查看路径" : "生成路径",
      },
      {
        title: "学习资源",
        description: "围绕某个步骤生成讲义、导图、练习和实操材料。",
        href: "/resources",
        icon: FileText,
        status: snapshot.resources.length > 0 ? "done" : snapshot.steps.length > 0 ? "active" : "todo",
        actionLabel: snapshot.resources.length > 0 ? "查看资料" : "生成资料",
      },
      {
        title: "智能辅导",
        description: "对不懂的问题进行追问，回答会尽量给出课程来源。",
        href: "/tutor",
        icon: MessageCircleQuestion,
        status: snapshot.resources.length > 0 ? "active" : "todo",
        actionLabel: "去提问",
      },
      {
        title: "练习测验",
        description: "完成小测，检查 JOIN、事务和索引等薄弱点。",
        href: "/practice",
        icon: ClipboardCheck,
        status: snapshot.attempts.length > 0 ? "done" : snapshot.steps.length > 0 ? "active" : "todo",
        actionLabel: snapshot.attempts.length > 0 ? "查看结果" : "做一次小测",
      },
      {
        title: "学习评估",
        description: "查看准确率、掌握度变化和补救建议。",
        href: "/analytics",
        icon: BarChart3,
        status: snapshot.analytics?.latest_report ? "done" : snapshot.attempts.length > 0 ? "active" : "todo",
        actionLabel: "查看诊断",
      },
    ] as const;

    return {
      profile,
      nextAction,
      todayStep,
      weakPoints,
      mastery,
      overviewItems,
      journey,
      currentStatus:
        weakPoints.length > 0
          ? `正在优先补 ${weakPoints.slice(0, 3).join("、")}`
          : todayStep
            ? `正在推进 ${todayStep.title}`
            : "准备生成专属学习计划",
      averageAccuracy: snapshot.analytics
        ? formatPercent(snapshot.analytics.average_accuracy)
        : null,
    };
  }, [snapshot]);

  if (loading) {
    return (
      <PageContainer>
        <LoadingState title="正在整理你的学习状态..." rows={5} />
      </PageContainer>
    );
  }

  if (error || !snapshot || !derived) {
    return (
      <PageContainer>
        <ErrorPanel message={error ?? "学习工作台暂时无法加载。"} onRetry={load} />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-center lg:p-8">
          <div>
            <StatusPill tone="active">学习工作台</StatusPill>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              你好，{snapshot.demo.student_name ?? "示例学生"}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              今天继续学习《{snapshot.demo.course_title ?? "数据库系统"}》。系统会根据你的画像、路径和练习反馈，
              推荐下一步最值得推进的学习任务。
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <StatusPill>当前目标：{derived.profile?.learning_goal || "7 天掌握数据库系统期末重点"}</StatusPill>
              <StatusPill tone="warning">{derived.currentStatus}</StatusPill>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="bg-sky-700 hover:bg-sky-800">
                <Link href={derived.nextAction.href}>{derived.nextAction.label}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/analytics">查看学习评估</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <StatCard
              label="平均准确率"
              value={derived.averageAccuracy ?? "暂无"}
              helper="完成测验后自动更新"
              icon={Target}
              tone={snapshot.attempts.length > 0 ? "success" : "default"}
            />
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-950">今日任务状态</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {derived.todayStep ? `推荐推进：${derived.todayStep.title}` : "先补齐画像或学习路径。"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <LearningTaskCard
            title={derived.todayStep?.title ?? "先生成你的个性化学习路径"}
            description={
              derived.todayStep?.objective ?? "系统会根据你的画像和课程知识点，安排今天应该优先学习的主题。"
            }
            reason={
              derived.todayStep
                ? "根据当前学习路径和薄弱点，建议先推进这一小步，再进入资源学习、提问和练习。"
                : "生成路径后，今日任务会自动出现在这里。"
            }
            minutes={derived.todayStep?.estimated_minutes}
            tags={derived.todayStep ? parseJsonArray(derived.todayStep.knowledge_points_json) : derived.weakPoints}
            href={derived.todayStep ? "/resources" : derived.nextAction.href}
            actionLabel={derived.todayStep ? "继续学习这一步" : derived.nextAction.label}
          />

          <SectionCard>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">学习旅程</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  按顺序完成画像、路径、资源、辅导、练习和评估，会形成一条可持续优化的学习闭环。
                </p>
              </div>
              <StatusPill tone={snapshot.demo.overall_ready ? "success" : "default"}>
                {snapshot.demo.overall_ready ? "流程基本就绪" : "继续补全学习数据"}
              </StatusPill>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {derived.journey.map((item) => (
                <LearningStepCard key={item.href} {...item} />
              ))}
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-6">
          <SectionCard>
            <h2 className="text-lg font-semibold text-slate-950">我的薄弱点</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              这些主题会影响学习路径、资源生成和测验重点。
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(derived.weakPoints.length ? derived.weakPoints.slice(0, 5) : ["JOIN", "事务隔离级别", "B+ 树索引"]).map(
                (item) => (
                  <StatusPill key={item} tone="warning">
                    {item}
                  </StatusPill>
                ),
              )}
            </div>
            <div className="mt-5 space-y-4">
              {Object.entries(derived.mastery).slice(0, 5).map(([name, value]) => (
                <div key={name}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800">{name}</span>
                    <span className="text-slate-500">{Math.round(value)}%</span>
                  </div>
                  <Progress value={Math.max(0, Math.min(100, value))} />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard>
            <h2 className="text-lg font-semibold text-slate-950">学习概览</h2>
            <div className="mt-4 grid gap-3">
              {derived.overviewItems.map((item) => (
                <StatCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  helper={item.helper}
                  icon={item.icon}
                  tone={item.tone}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard>
            <h2 className="text-lg font-semibold text-slate-950">最近结果</h2>
            <div className="mt-4 space-y-3 text-sm">
              <p className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                最近测验：{snapshot.attempts[0] ? `${snapshot.attempts[0].total_score}/${snapshot.attempts[0].max_score} 分` : "尚未提交测验"}
              </p>
              <p className="rounded-2xl border border-slate-200 bg-slate-50 p-3 leading-6">
                评估建议：{snapshot.analytics?.latest_report?.next_plan_suggestion || "完成一次测验后会生成下一步建议。"}
              </p>
            </div>
          </SectionCard>
        </aside>
      </div>
    </PageContainer>
  );
}
