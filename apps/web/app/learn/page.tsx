"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ClipboardCheck,
  FileText,
  MessageCircleQuestion,
  Route,
  UserRound,
} from "lucide-react";

import { ErrorState } from "@/components/error-state";
import { LearningJourneyCard } from "@/components/learning-journey-card";
import { LoadingState } from "@/components/loading-state";
import { ProgressOverviewCard } from "@/components/progress-overview-card";
import { StudentHeroCard } from "@/components/student-hero-card";
import { TodayTaskCard } from "@/components/today-task-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeakPointCard } from "@/components/weak-point-card";
import {
  getDemoStatus,
  getGeneratedResources,
  getLearningAnalytics,
  getLearningPath,
  getLearningPaths,
  getPracticeAttempts,
  getProfileSummary,
} from "@/lib/api";
import type {
  DemoStatusResponse,
  GeneratedResource,
  LearningAnalyticsSummary,
  LearningPath,
  LearningPathStep,
  LearnerProfile,
  PracticeAttempt,
  ProfileSummaryResponse,
} from "@/lib/types";

interface LearnSnapshot {
  demo: DemoStatusResponse;
  profileSummary: ProfileSummaryResponse | null;
  paths: LearningPath[];
  steps: LearningPathStep[];
  resources: GeneratedResource[];
  attempts: PracticeAttempt[];
  analytics: LearningAnalyticsSummary | null;
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

      if (studentId && courseId) {
        const [profileResult, pathsResult, resourcesResult, attemptsResult, analyticsResult] =
          await Promise.allSettled([
            getProfileSummary(studentId, courseId),
            getLearningPaths({ student_id: studentId, course_id: courseId }),
            getGeneratedResources({ student_id: studentId, course_id: courseId }),
            getPracticeAttempts({ student_id: studentId, course_id: courseId }),
            getLearningAnalytics(studentId, courseId),
          ]);

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

      setSnapshot({ demo, profileSummary, paths, steps, resources, attempts, analytics });
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
      },
      {
        label: "学习路径",
        value: snapshot.steps.length > 0 ? `${snapshot.steps.length} 步` : "未生成",
        helper: snapshot.paths[0]?.title ?? "生成后会安排每日学习顺序",
      },
      {
        label: "学习资料",
        value: `${snapshot.resources.length} 个`,
        helper: "讲义、思维导图、练习题等资料",
      },
      {
        label: "练习结果",
        value: snapshot.analytics
          ? formatPercent(snapshot.analytics.average_accuracy)
          : `${snapshot.attempts.length} 次`,
        helper: snapshot.analytics ? "平均准确率" : "完成小测后会出现诊断",
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
    };
  }, [snapshot]);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <LoadingState title="正在整理你的学习状态..." rows={5} />
      </main>
    );
  }

  if (error || !snapshot || !derived) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState message={error ?? "学习工作台暂时无法加载。"} onRetry={load} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <StudentHeroCard
        studentName={snapshot.demo.student_name}
        courseTitle={snapshot.demo.course_title}
        learningGoal={derived.profile?.learning_goal}
        nextHref={derived.nextAction.href}
        nextLabel={derived.nextAction.label}
      />

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <TodayTaskCard
          step={derived.todayStep}
          reason={
            derived.todayStep
              ? "根据当前路径和薄弱点，建议今天先推进这一小步。"
              : "生成路径后，系统会自动推荐今天最适合的主题。"
          }
        />
        <WeakPointCard weakPoints={derived.weakPoints} mastery={derived.mastery} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">学习进度概览</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            这里汇总你当前已经完成的学习准备和练习反馈。
          </p>
        </div>
        <ProgressOverviewCard items={derived.overviewItems} />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">你的学习旅程</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              从画像到评估，按顺序完成会形成一条完整的学习闭环。
            </p>
          </div>
          <Badge variant={snapshot.demo.overall_ready ? "success" : "outline"}>
            {snapshot.demo.overall_ready ? "演示数据基本就绪" : "继续补全学习数据"}
          </Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {derived.journey.map((item) => (
            <LearningJourneyCard key={item.href} {...item} />
          ))}
        </div>
      </section>

      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle>最近学习结果</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            完成练习后，这里会沉淀为学习诊断，而不是只留下孤立的一次分数。
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-slate-50 p-4">
            <p className="text-sm text-slate-500">最近画像更新</p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {derived.profile?.updated_at
                ? new Date(derived.profile.updated_at).toLocaleString("zh-CN")
                : "尚未生成画像"}
            </p>
          </div>
          <div className="rounded-lg border bg-slate-50 p-4">
            <p className="text-sm text-slate-500">最近一次测验</p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {snapshot.attempts[0]
                ? `${snapshot.attempts[0].total_score}/${snapshot.attempts[0].max_score} 分`
                : "尚未提交测验"}
            </p>
          </div>
          <div className="rounded-lg border bg-slate-50 p-4">
            <p className="text-sm text-slate-500">学习诊断</p>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-900">
              {snapshot.analytics?.latest_report?.summary || "完成一次测验后会生成诊断摘要。"}
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
