"use client";

import { SendHorizonal, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  chatWithProfileAgent,
  getAgentRuns,
  getCourses,
  getProfileDimensionCheck,
  getProfileSummary,
  getStudents,
} from "@/lib/api";
import type {
  AgentRun,
  Course,
  LearnerProfile,
  ProfileChatMessage,
  ProfileDimensionCheck,
  Student,
} from "@/lib/types";

const SAMPLE_MESSAGE =
  "我是大二计科学生，数据库要期末考试了。SQL 基础还行，但是 JOIN、事务隔离级别、索引和 B+ 树不太会。每天能学 2 小时，希望 7 天过一遍重点。我喜欢例题和图解，不太喜欢大段理论。";

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

function DimensionCard({
  title,
  value,
}: {
  title: string;
  value: string | string[] | Record<string, number>;
}) {
  let content: ReactNode;
  if (Array.isArray(value)) {
    content = value.length ? (
      <div className="flex flex-wrap gap-2">
        {value.map((item) => (
          <Badge key={item} variant="outline">
            {item}
          </Badge>
        ))}
      </div>
    ) : (
      <span className="text-muted-foreground">待补充</span>
    );
  } else if (typeof value === "object") {
    const entries = Object.entries(value);
    content = entries.length ? (
      <div className="space-y-2">
        {entries.map(([name, score]) => (
          <div key={name} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>{name}</span>
              <span>{score}</span>
            </div>
            <Progress value={score} />
          </div>
        ))}
      </div>
    ) : (
      <span className="text-muted-foreground">待补充</span>
    );
  } else {
    content = value || <span className="text-muted-foreground">待补充</span>;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-6">{content}</CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>();
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>();
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [messages, setMessages] = useState<ProfileChatMessage[]>([]);
  const [dimensionCheck, setDimensionCheck] = useState<ProfileDimensionCheck | null>(null);
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([]);
  const [message, setMessage] = useState(SAMPLE_MESSAGE);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async (studentId: number, courseId: number) => {
    const [summary, dimension, runs] = await Promise.all([
      getProfileSummary(studentId, courseId),
      getProfileDimensionCheck(studentId, courseId),
      getAgentRuns({ agent_name: "ProfileAgent", student_id: studentId, course_id: courseId }),
    ]);
    setProfile(summary.profile ?? null);
    setMessages(summary.messages);
    setDimensionCheck(dimension);
    setAgentRuns(runs);
  }, []);

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
        await refreshProfile(defaultStudent.id, defaultCourse.id);
      }
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [refreshProfile]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const profileDimensions = useMemo(() => {
    const preferences = safeJson<string[]>(profile?.learning_preference_json, []);
    const weakPoints = safeJson<string[]>(profile?.weak_points_json, []);
    const mastery = safeJson<Record<string, number>>(profile?.mastery_json, {});
    return [
      { title: "专业背景", value: profile?.major ?? "" },
      { title: "学习目标", value: profile?.learning_goal ?? "" },
      { title: "知识基础", value: profile?.knowledge_base ?? "" },
      { title: "学习偏好", value: preferences },
      { title: "认知风格", value: profile?.cognitive_style ?? "" },
      { title: "易错点", value: weakPoints },
      { title: "时间约束", value: profile?.time_constraint ?? "" },
      { title: "知识点掌握度", value: mastery },
    ];
  }, [profile]);

  async function handleSelectionChange(studentId: number, courseId: number) {
    setSelectedStudentId(studentId);
    setSelectedCourseId(courseId);
    setError(null);
    try {
      await refreshProfile(studentId, courseId);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function handleSend() {
    if (!selectedStudentId || !selectedCourseId || !message.trim()) {
      return;
    }
    setSending(true);
    setError(null);
    try {
      await chatWithProfileAgent({
        student_id: selectedStudentId,
        course_id: selectedCourseId,
        message: message.trim(),
      });
      setMessage("");
      await refreshProfile(selectedStudentId, selectedCourseId);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSending(false);
    }
  }

  const completion = Math.round((dimensionCheck?.completion_rate ?? 0) * 100);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-lg border bg-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge variant="warning">Phase 6</Badge>
            <h1 className="mt-3 text-3xl font-bold">对话式学习画像</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              这是 A3 赛题核心功能之一：学生通过自然语言描述专业、目标、基础、薄弱点和偏好，
              ProfileAgent 自动抽取并更新 8 维学习画像。当前阶段只使用 MockLLM，不调用真实外部 API，
              不需要 API Key，不产生费用。
            </p>
          </div>
          <div className="rounded-lg border bg-background p-4 text-sm">
            <p className="font-medium">8 维画像</p>
            <p className="mt-1 text-muted-foreground">专业背景、学习目标、知识基础、学习偏好、认知风格、易错点、时间约束、掌握度</p>
          </div>
        </div>
      </section>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>画像服务暂不可用</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <Skeleton className="h-[520px]" />
          <Skeleton className="h-[520px]" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <section className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">学生与课程</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
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

            <Card>
              <CardHeader>
                <CardTitle className="text-base">画像对话</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="min-h-[280px] space-y-3 rounded-lg border bg-background p-4">
                  {messages.length ? (
                    messages.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-lg p-3 text-sm leading-6 ${
                          item.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"
                        } max-w-[88%]`}
                      >
                        <p className="mb-1 text-xs opacity-70">
                          {item.role === "user" ? "学生" : "ProfileAgent"}
                        </p>
                        <p>{item.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                      还没有画像对话，发送示例输入即可生成第一版画像。
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setMessage(SAMPLE_MESSAGE)}>
                    填入示例输入
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessage("我这周每天只有 1 小时，想优先补事务隔离级别。")}
                  >
                    填入更新输入
                  </Button>
                </div>
                <textarea
                  className="min-h-28 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm leading-6"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="描述你的专业、学习目标、薄弱点、偏好和时间安排..."
                />
                <Button onClick={handleSend} disabled={sending || !message.trim()}>
                  <SendHorizonal className="h-4 w-4" aria-hidden="true" />
                  {sending ? "发送中" : "发送给 ProfileAgent"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">最近 ProfileAgent 运行记录</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {agentRuns.length ? (
                  agentRuns.slice(0, 6).map((run) => (
                    <div key={run.id} className="rounded-lg border bg-background p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
                          <span className="font-medium">{run.agent_name}</span>
                        </div>
                        <Badge variant={run.status === "success" ? "success" : "outline"}>
                          {run.status}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        latency: {run.latency_ms ?? 0} ms / llm_log_id: {run.llm_log_id ?? "-"}
                      </p>
                      <p className="mt-2 line-clamp-2 text-muted-foreground">{run.input_preview}</p>
                      {run.output_preview ? <p className="mt-1 line-clamp-2">{run.output_preview}</p> : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">暂无运行记录。</p>
                )}
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">画像完成度</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>{completion}%</span>
                  <span className="text-muted-foreground">version {profile?.version ?? "-"}</span>
                </div>
                <Progress value={completion} />
                <div className="flex flex-wrap gap-2">
                  {dimensionCheck?.completed_dimensions.map((item) => (
                    <Badge key={item} variant="success">
                      {item}
                    </Badge>
                  ))}
                  {dimensionCheck?.missing_dimensions.map((item) => (
                    <Badge key={item} variant="outline">
                      {item}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-3">
              {profileDimensions.map((item) => (
                <DimensionCard key={item.title} title={item.title} value={item.value} />
              ))}
            </div>

            <Alert>
              <AlertTitle>阶段边界</AlertTitle>
              <AlertDescription>
                当前只实现 ProfileAgent 和画像记录。学习路径、资源生成、智能辅导、测验批改和完整多智能体编排将在后续阶段实现。
              </AlertDescription>
            </Alert>
          </aside>
        </div>
      )}
    </div>
  );
}
