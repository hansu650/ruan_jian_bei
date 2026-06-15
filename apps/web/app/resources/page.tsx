"use client";

import { BookOpenText, FileText, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ActionConfirmCard } from "@/components/action-confirm-card";
import { CitationList } from "@/components/citation-list";
import { LiveModelWarning } from "@/components/live-model-warning";
import { MarkdownPreview } from "@/components/markdown-preview";
import { ResourceTypeBadge, resourceTypeLabel } from "@/components/resource-type-badge";
import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  generateResourcesForStep,
  getDemoStatus,
  getAgentRuns,
  getCourses,
  getGeneratedResources,
  getGeneratedResourceTypes,
  getLearningPath,
  getLearningPaths,
  getProfileSummary,
  getStudents,
} from "@/lib/api";
import type {
  AgentRun,
  Course,
  GeneratedResource,
  LearnerProfile,
  LearningPath,
  LearningPathDetailResponse,
  LearningPathStep,
  LLMModeInfo,
  ResourceTypeInfo,
  Student,
} from "@/lib/types";

function safeJson<T>(value: string | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "请求失败，请确认后端服务是否启动。";
}

function resourcePreview(content: string) {
  const withoutFences = content.replace(/```([a-zA-Z0-9_-]+)?\s*[\s\S]*?```/g, (_, language: string | undefined) => {
    const label = language?.toLowerCase();
    if (label === "mermaid") {
      return "思维导图内容";
    }
    if (label === "sql") {
      return "SQL 实操代码";
    }
    return "代码示例";
  });
  return withoutFences
    .replace(/\[(.*?)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^[>*\-\d.\s]+/gm, "")
    .replace(/[|`*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function citationCount(value: string | undefined) {
  return safeJson<Array<unknown>>(value, []).length;
}

function ResourceTypeBadges({ values }: { values: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((item) => (
        <ResourceTypeBadge key={item} type={item} />
      ))}
    </div>
  );
}

function ProfileCard({ profile }: { profile: LearnerProfile | null }) {
  if (!profile) {
    return (
      <Alert>
        <AlertTitle>还没有学习画像</AlertTitle>
        <AlertDescription>
          请先在 <Link href="/profile" className="font-medium underline">/profile</Link> 生成画像。
        </AlertDescription>
      </Alert>
    );
  }
  const weakPoints = safeJson<string[]>(profile.weak_points_json, []);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">画像摘要</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="font-medium">学习目标</p>
          <p className="mt-1 text-muted-foreground">{profile.learning_goal || "待补充"}</p>
        </div>
        <div>
          <p className="mb-2 font-medium">薄弱点</p>
          <ResourceTypeBadges values={weakPoints} />
        </div>
      </CardContent>
    </Card>
  );
}

function ResourceContent({ resource }: { resource: GeneratedResource | null }) {
  if (!resource) {
    return (
      <Card>
        <CardContent className="flex min-h-[420px] items-center justify-center p-8 text-center">
          <div>
            <FileText className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-semibold">还没有选择资源</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              选择一个学习路径步骤，生成资源后可在这里查看正文和引用来源。
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>{resource.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {resourceTypeLabel(resource.resource_type)} · 已保存为可继续学习的资料
            </p>
          </div>
          <StatusBadge status={resource.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <MarkdownPreview content={resource.content} />
        <div>
          <h3 className="font-semibold">引用来源</h3>
          <div className="mt-3">
            <CitationList
              citations={resource.citations_json}
              emptyText="暂无引用，请先在知识库页面导入示例资料。"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResourcesPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [resourceTypes, setResourceTypes] = useState<ResourceTypeInfo[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>();
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>();
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [pathDetail, setPathDetail] = useState<LearningPathDetailResponse | null>(null);
  const [selectedPathId, setSelectedPathId] = useState<number | undefined>();
  const [selectedStepId, setSelectedStepId] = useState<number | undefined>();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [resources, setResources] = useState<GeneratedResource[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<number | undefined>();
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([]);
  const [llmMode, setLlmMode] = useState<LLMModeInfo | null>(null);
  const [confirmedLiveGenerate, setConfirmedLiveGenerate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedStep = useMemo<LearningPathStep | undefined>(
    () => pathDetail?.steps.find((step) => step.id === selectedStepId),
    [pathDetail, selectedStepId],
  );
  const selectedResource = useMemo(
    () => resources.find((item) => item.id === selectedResourceId) ?? resources[0] ?? null,
    [resources, selectedResourceId],
  );

  const loadResources = useCallback(
    async (studentId: number, courseId: number, stepId: number) => {
      const [nextResources, runs] = await Promise.all([
        getGeneratedResources({ student_id: studentId, course_id: courseId, step_id: stepId }),
        getAgentRuns({
          agent_name: "ResourceAgent",
          student_id: studentId,
          course_id: courseId,
          limit: 8,
        }),
      ]);
      setResources(nextResources);
      setSelectedResourceId(nextResources[0]?.id);
      setAgentRuns(runs);
    },
    [],
  );

  const loadPathDetail = useCallback(
    async (studentId: number, courseId: number, pathId: number) => {
      const detail = await getLearningPath(pathId);
      setPathDetail(detail);
      const stepId = detail.steps[0]?.id;
      setSelectedStepId(stepId);
      if (stepId) {
        await loadResources(studentId, courseId, stepId);
      } else {
        setResources([]);
        setSelectedResourceId(undefined);
      }
    },
    [loadResources],
  );

  const loadForSelection = useCallback(
    async (studentId: number, courseId: number) => {
      const [summary, pathList] = await Promise.all([
        getProfileSummary(studentId, courseId),
        getLearningPaths({ student_id: studentId, course_id: courseId }),
      ]);
      setProfile(summary.profile ?? null);
      setPaths(pathList);
      const firstPath = pathList[0];
      setSelectedPathId(firstPath?.id);
      if (firstPath) {
        await loadPathDetail(studentId, courseId, firstPath.id);
      } else {
        setPathDetail(null);
        setSelectedStepId(undefined);
        setResources([]);
        setSelectedResourceId(undefined);
      }
    },
    [loadPathDetail],
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentList, courseList, typeList, demoStatus] = await Promise.all([
        getStudents(),
        getCourses(),
        getGeneratedResourceTypes(),
        getDemoStatus(),
      ]);
      setStudents(studentList);
      setCourses(courseList);
      setResourceTypes(typeList);
      setLlmMode(demoStatus.llm_mode);
      const defaultType = typeList.find((item) => item.key === "lecture_note") ?? typeList[0];
      setSelectedTypes(defaultType ? [defaultType.key] : []);
      const defaultStudent = studentList.find((item) => item.name === "示例学生") ?? studentList[0];
      const defaultCourse = courseList.find((item) => item.title === "数据库系统") ?? courseList[0];
      if (defaultStudent && defaultCourse) {
        setSelectedStudentId(defaultStudent.id);
        setSelectedCourseId(defaultCourse.id);
        await loadForSelection(defaultStudent.id, defaultCourse.id);
      }
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [loadForSelection]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  async function handleSelectionChange(studentId: number, courseId: number) {
    setSelectedStudentId(studentId);
    setSelectedCourseId(courseId);
    setError(null);
    try {
      await loadForSelection(studentId, courseId);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function handlePathChange(pathId: number) {
    if (!selectedStudentId || !selectedCourseId) {
      return;
    }
    setSelectedPathId(pathId);
    setError(null);
    try {
      await loadPathDetail(selectedStudentId, selectedCourseId, pathId);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function handleStepChange(stepId: number) {
    if (!selectedStudentId || !selectedCourseId) {
      return;
    }
    setSelectedStepId(stepId);
    setError(null);
    try {
      await loadResources(selectedStudentId, selectedCourseId, stepId);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  function toggleResourceType(key: string) {
    setConfirmedLiveGenerate(false);
    setSelectedTypes((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  }

  const requiresLiveConfirmation =
    llmMode?.effective_provider === "spark-http" && selectedTypes.length >= 2;

  async function handleGenerate() {
    if (!selectedStudentId || !selectedCourseId || !selectedStepId) {
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const response = await generateResourcesForStep({
        student_id: selectedStudentId,
        course_id: selectedCourseId,
        step_id: selectedStepId,
        profile_id: profile?.id,
        resource_types: selectedTypes,
        regenerate: true,
      });
      setResources(response.resources);
      setSelectedResourceId(response.resources[0]?.id);
      setConfirmedLiveGenerate(false);
      const runs = await getAgentRuns({
        agent_name: "ResourceAgent",
        student_id: selectedStudentId,
        course_id: selectedCourseId,
        limit: 8,
      });
      setAgentRuns(runs);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-lg border bg-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge variant="secondary">学习资料</Badge>
            <h1 className="mt-3 text-3xl font-bold">学习资源</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              选择学习路径中的一个步骤，生成讲义、思维导图、练习题、拓展阅读、
              实操案例或视频讲解脚本。资源会尽量带上课程知识库来源。
            </p>
          </div>
          <Alert className="max-w-md">
            <AlertTitle>使用建议</AlertTitle>
            <AlertDescription>
              演示时建议先生成 1-2 类重点资源，确认质量后再批量生成全部类型。
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>资源生成服务暂不可用</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <Skeleton className="h-[720px]" />
          <Skeleton className="h-[720px]" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">学生与课程</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="space-y-1 text-sm">
                  <span className="font-medium">学生</span>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2"
                    value={selectedStudentId ?? ""}
                    onChange={(event) =>
                      selectedCourseId
                        ? void handleSelectionChange(Number(event.target.value), selectedCourseId)
                        : setSelectedStudentId(Number(event.target.value))
                    }
                  >
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} / {student.major}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium">课程</span>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2"
                    value={selectedCourseId ?? ""}
                    onChange={(event) =>
                      selectedStudentId
                        ? void handleSelectionChange(selectedStudentId, Number(event.target.value))
                        : setSelectedCourseId(Number(event.target.value))
                    }
                  >
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </label>
              </CardContent>
            </Card>

            <ProfileCard profile={profile} />

            <LiveModelWarning mode={llmMode} compact />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">路径与步骤</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {paths.length ? (
                  <>
                    <label className="space-y-1 text-sm">
                      <span className="font-medium">学习路径</span>
                      <select
                        className="w-full rounded-md border bg-background px-3 py-2"
                        value={selectedPathId ?? ""}
                        onChange={(event) => void handlePathChange(Number(event.target.value))}
                      >
                        {paths.map((path) => (
                          <option key={path.id} value={path.id}>
                            {path.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="font-medium">学习步骤</span>
                      <select
                        className="w-full rounded-md border bg-background px-3 py-2"
                        value={selectedStepId ?? ""}
                        onChange={(event) => void handleStepChange(Number(event.target.value))}
                      >
                        {pathDetail?.steps.map((step) => (
                          <option key={step.id} value={step.id}>
                            Step {step.order_index} · {step.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    {selectedStep ? (
                      <div className="rounded-lg border bg-background p-3 text-sm">
                        <p className="font-medium">{selectedStep.objective}</p>
                        <p className="mt-2 text-muted-foreground">
                          掌握标准：{selectedStep.mastery_threshold} 分
                        </p>
                        <ResourceTypeBadges
                          values={safeJson<string[]>(
                            selectedStep.recommended_resource_types_json,
                            [],
                          )}
                        />
                      </div>
                    ) : null}
                  </>
                ) : (
                  <Alert>
                    <AlertTitle>还没有学习路径</AlertTitle>
                    <AlertDescription>
                      请先在 <Link href="/learning-path" className="font-medium underline">/learning-path</Link>{" "}
                      生成路径，再回来生成资源。
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">资源类型</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs leading-5 text-muted-foreground">
                  默认只选择讲义，适合先小流量确认质量；需要更多类型时再手动勾选。
                </p>
                {resourceTypes.map((type) => (
                  <label
                    key={type.key}
                    className="flex cursor-pointer gap-3 rounded-lg border bg-background p-3 text-sm"
                  >
                    <input
                      checked={selectedTypes.includes(type.key)}
                      className="mt-1"
                      onChange={() => toggleResourceType(type.key)}
                      type="checkbox"
                    />
                    <span>
                      <span className="block font-medium">{type.title}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {type.description}
                      </span>
                    </span>
                  </label>
                ))}
                {requiresLiveConfirmation ? (
                  <ActionConfirmCard
                    title="真实模型批量生成确认"
                    description="当前为 spark-http 模式，生成多个资源类型会发起多次真实模型调用，可能受网络、并发或额度策略影响。"
                    checked={confirmedLiveGenerate}
                    onCheckedChange={setConfirmedLiveGenerate}
                    liveMode
                  />
                ) : null}
                <Button
                  className="w-full"
                  disabled={
                    !profile ||
                    !selectedStepId ||
                    !selectedTypes.length ||
                    generating ||
                    (requiresLiveConfirmation && !confirmedLiveGenerate)
                  }
                  onClick={handleGenerate}
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  {generating ? "生成中" : "生成选中资源"}
                </Button>
              </CardContent>
            </Card>
          </aside>

          <section className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">已生成资源</CardTitle>
              </CardHeader>
              <CardContent>
                {resources.length ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {resources.map((resource) => {
                      const active = selectedResource?.id === resource.id;
                      return (
                      <button
                        key={resource.id}
                        className={`rounded-xl border p-4 text-left transition hover:border-sky-300 hover:bg-sky-50/40 ${
                          active ? "border-sky-300 bg-sky-50/70 shadow-sm" : "border-slate-200 bg-white"
                        }`}
                        onClick={() => setSelectedResourceId(resource.id)}
                        type="button"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-sm font-semibold leading-6 text-slate-950">
                            {resource.title}
                          </p>
                          <ResourceTypeBadge type={resource.resource_type} />
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                          {resourcePreview(resource.content) || "已生成资源，点击查看正文。"}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <StatusBadge status={resource.status} />
                          <span>{citationCount(resource.citations_json)} 条来源</span>
                          <span>{new Date(resource.created_at).toLocaleDateString("zh-CN")}</span>
                        </div>
                      </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    选择步骤并生成资源后，这里会展示 6 类资源卡片。
                  </p>
                )}
              </CardContent>
            </Card>

            <ResourceContent resource={selectedResource} />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">最近学习资料记录</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {agentRuns.length ? (
                  agentRuns.map((run) => (
                    <div key={run.id} className="rounded-lg border bg-background p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">学习资料已保存</p>
                        <Badge variant={run.status === "success" ? "success" : "warning"}>
                          {run.status === "success" ? "已完成" : "需查看"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {new Date(run.created_at).toLocaleString("zh-CN")}
                      </p>
                      <p className="mt-2 line-clamp-2 text-muted-foreground">
                        {resourcePreview(run.output_preview || run.input_preview) || "资源生成记录已保存。"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">暂无学习资料记录。</p>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      )}

      <Card>
        <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
          <BookOpenText className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
          <p>
            资源内容会结合课程知识库，并记录引用来源。系统不会复制出版教材原文或未授权资料。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
