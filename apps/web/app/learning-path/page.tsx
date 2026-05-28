"use client";

import { ArrowRight, Clock3, Route } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  generateLearningPath,
  getCourses,
  getLearningPath,
  getLearningPathPlanCheck,
  getLearningPaths,
  getProfileSummary,
  getStudents,
} from "@/lib/api";
import type {
  Course,
  LearnerProfile,
  LearningPath,
  LearningPathDetailResponse,
  LearningPathPlanCheck,
  Student,
} from "@/lib/types";

const RESOURCE_LABELS: Record<string, string> = {
  lecture_note: "讲义",
  mindmap: "思维导图",
  quiz: "练习题",
  reading: "拓展阅读",
  practice_case: "实操案例",
  video_script: "视频脚本",
};

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

function ResourceBadges({ values }: { values: string[] }) {
  if (!values.length) {
    return <span className="text-sm text-muted-foreground">暂无推荐</span>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((item) => (
        <Badge key={item} variant="outline">
          {RESOURCE_LABELS[item] ?? item}
        </Badge>
      ))}
    </div>
  );
}

function ProfileSnapshot({ profile }: { profile: LearnerProfile }) {
  const weakPoints = safeJson<string[]>(profile.weak_points_json, []);
  const preferences = safeJson<string[]>(profile.learning_preference_json, []);
  const mastery = safeJson<Record<string, number>>(profile.mastery_json, {});
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">画像状态</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="font-medium">学习目标</p>
          <p className="mt-1 text-muted-foreground">{profile.learning_goal || "待补充"}</p>
        </div>
        <div>
          <p className="font-medium">薄弱点</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {weakPoints.map((item) => (
              <Badge key={item} variant="warning">
                {item}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="font-medium">学习偏好</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {preferences.map((item) => (
              <Badge key={item} variant="outline">
                {item}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="font-medium">时间约束</p>
          <p className="mt-1 text-muted-foreground">{profile.time_constraint || "待补充"}</p>
        </div>
        <div className="space-y-2">
          <p className="font-medium">掌握度摘要</p>
          {Object.entries(mastery).map(([name, score]) => (
            <div key={name} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>{name}</span>
                <span>{score}</span>
              </div>
              <Progress value={score} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function LearningPathPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>();
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>();
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [detail, setDetail] = useState<LearningPathDetailResponse | null>(null);
  const [planCheck, setPlanCheck] = useState<LearningPathPlanCheck | null>(null);
  const [targetDays, setTargetDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPathDetail = useCallback(async (pathId: number) => {
    const [nextDetail, nextCheck] = await Promise.all([
      getLearningPath(pathId),
      getLearningPathPlanCheck(pathId),
    ]);
    setDetail(nextDetail);
    setPlanCheck(nextCheck);
  }, []);

  const refreshData = useCallback(
    async (studentId: number, courseId: number) => {
      const [summary, pathList] = await Promise.all([
        getProfileSummary(studentId, courseId),
        getLearningPaths({ student_id: studentId, course_id: courseId }),
      ]);
      setProfile(summary.profile ?? null);
      setPaths(pathList);
      if (pathList[0]) {
        await refreshPathDetail(pathList[0].id);
      } else {
        setDetail(null);
        setPlanCheck(null);
      }
    },
    [refreshPathDetail],
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentList, courseList] = await Promise.all([getStudents(), getCourses()]);
      setStudents(studentList);
      setCourses(courseList);
      const defaultStudent = studentList.find((item) => item.name === "示例学生") ?? studentList[0];
      const defaultCourse = courseList.find((item) => item.title === "数据库系统") ?? courseList[0];
      if (defaultStudent && defaultCourse) {
        setSelectedStudentId(defaultStudent.id);
        setSelectedCourseId(defaultCourse.id);
        await refreshData(defaultStudent.id, defaultCourse.id);
      }
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [refreshData]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const pathWeakPoints = useMemo(
    () => safeJson<string[]>(detail?.path.weak_points_json, []),
    [detail],
  );
  const pathResources = useMemo(
    () => safeJson<string[]>(detail?.path.recommended_resource_types_json, []),
    [detail],
  );

  async function handleSelectionChange(studentId: number, courseId: number) {
    setSelectedStudentId(studentId);
    setSelectedCourseId(courseId);
    setError(null);
    try {
      await refreshData(studentId, courseId);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function handleGenerate() {
    if (!selectedStudentId || !selectedCourseId) {
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const generated = await generateLearningPath({
        student_id: selectedStudentId,
        course_id: selectedCourseId,
        profile_id: profile?.id,
        target_days: targetDays,
        regenerate: true,
      });
      setDetail({ path: generated.path, steps: generated.steps });
      const nextCheck = await getLearningPathPlanCheck(generated.path.id);
      setPlanCheck(nextCheck);
      const nextPaths = await getLearningPaths({
        student_id: selectedStudentId,
        course_id: selectedCourseId,
      });
      setPaths(nextPaths);
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
            <Badge variant="warning">Phase 7</Badge>
            <h1 className="mt-3 text-3xl font-bold">个性化学习路径</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              这是 A3 赛题核心功能：系统结合学生画像、课程知识点、掌握情况和学习偏好，
              生成阶段化学习计划，并推荐讲义、思维导图、练习题、拓展阅读、实操案例和视频脚本等资源类型。
            </p>
          </div>
          <Alert className="max-w-md">
            <AlertTitle>阶段边界</AlertTitle>
            <AlertDescription>
              第七阶段只推荐资源类型，不生成资源正文。ResourceAgent 会在第八阶段实现。
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>学习路径服务暂不可用</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <Skeleton className="h-[640px]" />
          <Skeleton className="h-[640px]" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
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

            {profile ? (
              <ProfileSnapshot profile={profile} />
            ) : (
              <Alert>
                <AlertTitle>还没有学习画像</AlertTitle>
                <AlertDescription>
                  请先生成学习画像，再让 PlannerAgent 根据画像规划路径。
                  <Button asChild variant="outline" size="sm" className="mt-3">
                    <Link href="/profile">
                      前往生成学习画像
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">生成路径</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="space-y-1 text-sm">
                  <span className="font-medium">target_days</span>
                  <input
                    className="w-full rounded-md border bg-background px-3 py-2"
                    min={1}
                    max={30}
                    type="number"
                    value={targetDays}
                    onChange={(event) => setTargetDays(Number(event.target.value))}
                  />
                </label>
                <Button onClick={handleGenerate} disabled={!profile || generating} className="w-full">
                  <Route className="h-4 w-4" aria-hidden="true" />
                  {generating ? "生成中" : "生成个性化学习路径"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">历史路径</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {paths.length ? (
                  paths.map((path) => (
                    <button
                      key={path.id}
                      className="w-full rounded-lg border bg-background p-3 text-left hover:border-primary/40"
                      onClick={() => void refreshPathDetail(path.id)}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="line-clamp-1 text-sm font-medium">{path.title}</p>
                        <Badge variant={path.status === "active" ? "success" : "outline"}>
                          {path.status}
                        </Badge>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{path.goal}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {new Date(path.created_at).toLocaleString()}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">暂无路径，生成后会显示在这里。</p>
                )}
              </CardContent>
            </Card>
          </aside>

          <section className="space-y-4">
            {detail ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>{detail.path.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <p className="leading-6 text-muted-foreground">{detail.path.strategy_summary}</p>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-lg border bg-background p-3">
                        <p className="text-xs text-muted-foreground">目标天数</p>
                        <p className="mt-1 text-lg font-semibold">{detail.path.target_days} 天</p>
                      </div>
                      <div className="rounded-lg border bg-background p-3">
                        <p className="text-xs text-muted-foreground">路径状态</p>
                        <p className="mt-1 text-lg font-semibold">{detail.path.status}</p>
                      </div>
                      <div className="rounded-lg border bg-background p-3">
                        <p className="text-xs text-muted-foreground">版本</p>
                        <p className="mt-1 text-lg font-semibold">v{detail.path.version}</p>
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 font-medium">覆盖薄弱点</p>
                      <div className="flex flex-wrap gap-2">
                        {pathWeakPoints.map((item) => (
                          <Badge key={item} variant="warning">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 font-medium">整体推荐资源类型</p>
                      <ResourceBadges values={pathResources} />
                    </div>
                  </CardContent>
                </Card>

                {planCheck ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">路径完整性检查</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-lg border bg-background p-3">
                        <p className="text-xs text-muted-foreground">步骤数</p>
                        <p className="mt-1 font-semibold">
                          {planCheck.actual_step_count} / {planCheck.required_step_count}
                        </p>
                      </div>
                      <div className="rounded-lg border bg-background p-3">
                        <p className="text-xs text-muted-foreground">薄弱点覆盖</p>
                        <Badge variant={planCheck.has_weak_point_coverage ? "success" : "warning"}>
                          {planCheck.has_weak_point_coverage ? "已覆盖" : "需补充"}
                        </Badge>
                      </div>
                      <div className="rounded-lg border bg-background p-3">
                        <p className="text-xs text-muted-foreground">总预计时长</p>
                        <p className="mt-1 font-semibold">{planCheck.total_estimated_minutes} 分钟</p>
                      </div>
                      <div className="rounded-lg border bg-background p-3">
                        <p className="text-xs text-muted-foreground">资源类型数</p>
                        <p className="mt-1 font-semibold">{planCheck.recommended_resource_types.length}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="mb-2 font-medium">已覆盖薄弱点</p>
                        <div className="flex flex-wrap gap-2">
                          {planCheck.covered_weak_points.map((item) => (
                            <Badge key={item} variant="success">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <p className="mb-2 font-medium">缺失薄弱点</p>
                        <div className="flex flex-wrap gap-2">
                          {planCheck.missing_weak_points.length ? (
                            planCheck.missing_weak_points.map((item) => (
                              <Badge key={item} variant="warning">
                                {item}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">暂无缺失</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">步骤时间线</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {detail.steps.map((step) => {
                      const points = safeJson<string[]>(step.knowledge_points_json, []);
                      const resources = safeJson<string[]>(step.recommended_resource_types_json, []);
                      return (
                        <div key={step.id} className="rounded-lg border bg-background p-4">
                          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <div>
                              <Badge variant="outline">Step {step.order_index}</Badge>
                              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                              <p className="mt-1 text-sm text-muted-foreground">{step.objective}</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock3 className="h-4 w-4" aria-hidden="true" />
                              {step.estimated_minutes} 分钟
                            </div>
                          </div>
                          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                            <div>
                              <p className="mb-2 font-medium">知识点</p>
                              <div className="flex flex-wrap gap-2">
                                {points.map((item) => (
                                  <Badge key={item} variant="outline">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="mb-2 font-medium">推荐资源类型</p>
                              <ResourceBadges values={resources} />
                            </div>
                            <div>
                              <p className="font-medium">前置要求</p>
                              <p className="mt-1 text-muted-foreground">{step.prerequisite || "无"}</p>
                            </div>
                            <div>
                              <p className="font-medium">掌握标准</p>
                              <p className="mt-1 text-muted-foreground">
                                掌握度达到 {step.mastery_threshold} 分
                              </p>
                            </div>
                          </div>
                          <p className="mt-4 text-sm leading-6">{step.recommended_activity}</p>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex min-h-[360px] items-center justify-center p-8 text-center">
                  <div>
                    <Route className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
                    <h2 className="mt-4 text-xl font-semibold">暂无学习路径</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      生成学习画像后，点击左侧按钮即可生成 7 天左右的个性化学习路径。
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
