"use client";

import { FileQuestion, MessageSquareText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  chatWithTutor,
  getCourses,
  getGeneratedResources,
  getLearningPath,
  getLearningPaths,
  getProfileSummary,
  getStudents,
  getTutorMessages,
  getTutorQualityCheck,
  getTutorScenarios,
  getTutorSessions,
} from "@/lib/api";
import type {
  Course,
  GeneratedResource,
  LearnerProfile,
  LearningPath,
  LearningPathDetailResponse,
  LearningPathStep,
  Student,
  TutorMessage,
  TutorQualityCheck,
  TutorScenarioInfo,
  TutorSession,
} from "@/lib/types";

type Citation = {
  chunk_id?: number;
  document_id?: number;
  filename?: string;
  chunk_index?: number;
  section_title?: string | null;
  quote?: string;
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

function safetyVariant(status: string): "success" | "warning" | "outline" {
  if (status === "grounded") {
    return "success";
  }
  if (status === "needs_review" || status === "unsafe") {
    return "warning";
  }
  return "outline";
}

function safetyLabel(status: string): string {
  const labels: Record<string, string> = {
    grounded: "有来源支撑",
    needs_review: "需要教师确认",
    unsafe: "版权/安全风险",
  };
  return labels[status] ?? status;
}

function ProfileSummaryCard({ profile }: { profile: LearnerProfile | null }) {
  if (!profile) {
    return (
      <Alert>
        <AlertTitle>未找到学习画像</AlertTitle>
        <AlertDescription>
          仍然可以提问，但回答个性化程度较低。建议先去{" "}
          <Link href="/profile" className="font-medium underline">
            /profile
          </Link>{" "}
          生成 8 维学习画像。
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
          <div className="flex flex-wrap gap-2">
            {weakPoints.length ? (
              weakPoints.map((item) => (
                <Badge key={item} variant="outline">
                  {item}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">暂无</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MessageBubble({
  message,
  onQualityCheck,
  quality,
}: {
  message: TutorMessage;
  onQualityCheck: (messageId: number) => void;
  quality?: TutorQualityCheck;
}) {
  const isUser = message.role === "user";
  const citations = safeJson<Citation[]>(message.citations_json, []);
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] rounded-lg border p-4 text-sm leading-6 ${
          isUser ? "bg-primary text-primary-foreground" : "bg-background"
        }`}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>

        {!isUser ? (
          <div className="mt-4 space-y-3 border-t pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={safetyVariant(message.safety_status)}>
                {safetyLabel(message.safety_status)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                confidence {(message.confidence_score * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{message.verifier_summary}</p>

            {message.safety_status === "needs_review" ? (
              <Alert>
                <AlertTitle>需要教师确认</AlertTitle>
                <AlertDescription>当前课程知识库未覆盖该内容，建议教师确认。</AlertDescription>
              </Alert>
            ) : null}

            {message.safety_status === "unsafe" ? (
              <Alert variant="destructive">
                <AlertTitle>版权或安全风险</AlertTitle>
                <AlertDescription>
                  该问题涉及版权或不适合处理的内容，系统不会复制出版教材原文或扫描件。
                </AlertDescription>
              </Alert>
            ) : null}

            <div>
              <p className="font-medium">引用来源</p>
              <div className="mt-2 space-y-2">
                {citations.length ? (
                  citations.map((citation, index) => (
                    <div key={`${citation.chunk_id}-${index}`} className="rounded-md border p-3">
                      <p className="font-medium">
                        {citation.filename ?? "unknown"} / chunk {citation.chunk_index ?? "-"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {citation.section_title || "未命名小节"}
                      </p>
                      <p className="mt-2">{citation.quote}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">暂无课程知识库引用。</p>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onQualityCheck(message.id)}
              type="button"
            >
              查看质量检查
            </Button>

            {quality ? (
              <div className="rounded-md border bg-muted/30 p-3 text-xs">
                <p>
                  引用：{quality.citation_count} 条，来源 chunk：{quality.source_chunk_count} 个
                </p>
                <p className="mt-1">建议：{quality.suggestion}</p>
                {quality.issues.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-4">
                    {quality.issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function TutorPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [scenarios, setScenarios] = useState<TutorScenarioInfo[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>();
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>();
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [pathDetail, setPathDetail] = useState<LearningPathDetailResponse | null>(null);
  const [selectedPathId, setSelectedPathId] = useState<number | undefined>();
  const [selectedStepId, setSelectedStepId] = useState<number | undefined>();
  const [resources, setResources] = useState<GeneratedResource[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<number | undefined>();
  const [sessions, setSessions] = useState<TutorSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | undefined>();
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [question, setQuestion] = useState("幻读和不可重复读有什么区别？");
  const [qualityChecks, setQualityChecks] = useState<Record<number, TutorQualityCheck>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedStep = useMemo<LearningPathStep | undefined>(
    () => pathDetail?.steps.find((step) => step.id === selectedStepId),
    [pathDetail, selectedStepId],
  );

  const loadSessionMessages = useCallback(async (sessionId: number) => {
    const nextMessages = await getTutorMessages(sessionId);
    setMessages(nextMessages);
    setSelectedSessionId(sessionId);
  }, []);

  const loadContext = useCallback(
    async (studentId: number, courseId: number) => {
      const [summary, pathList, resourceList, sessionList] = await Promise.all([
        getProfileSummary(studentId, courseId),
        getLearningPaths({ student_id: studentId, course_id: courseId }),
        getGeneratedResources({ student_id: studentId, course_id: courseId }),
        getTutorSessions({ student_id: studentId, course_id: courseId, limit: 20 }),
      ]);
      setProfile(summary.profile ?? null);
      setPaths(pathList);
      setResources(resourceList);
      setSelectedResourceId(resourceList[0]?.id);
      setSessions(sessionList);
      const firstPath = pathList[0];
      setSelectedPathId(firstPath?.id);
      if (firstPath) {
        const detail = await getLearningPath(firstPath.id);
        setPathDetail(detail);
        setSelectedStepId(detail.steps[0]?.id);
      } else {
        setPathDetail(null);
        setSelectedStepId(undefined);
      }
      if (sessionList[0]?.id) {
        await loadSessionMessages(sessionList[0].id);
      } else {
        setSelectedSessionId(undefined);
        setMessages([]);
      }
    },
    [loadSessionMessages],
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentList, courseList, scenarioList] = await Promise.all([
        getStudents(),
        getCourses(),
        getTutorScenarios(),
      ]);
      setStudents(studentList);
      setCourses(courseList);
      setScenarios(scenarioList);
      const defaultStudent = studentList[0];
      const defaultCourse = courseList[0];
      if (defaultStudent && defaultCourse) {
        setSelectedStudentId(defaultStudent.id);
        setSelectedCourseId(defaultCourse.id);
        await loadContext(defaultStudent.id, defaultCourse.id);
      }
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [loadContext]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  async function handleSelectionChange(studentId: number, courseId: number) {
    setSelectedStudentId(studentId);
    setSelectedCourseId(courseId);
    setError(null);
    try {
      await loadContext(studentId, courseId);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function handlePathChange(pathId: number | undefined) {
    setSelectedPathId(pathId);
    setSelectedStepId(undefined);
    if (!pathId) {
      setPathDetail(null);
      return;
    }
    try {
      const detail = await getLearningPath(pathId);
      setPathDetail(detail);
      setSelectedStepId(detail.steps[0]?.id);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function handleSessionChange(sessionId: number | undefined) {
    if (!sessionId) {
      setSelectedSessionId(undefined);
      setMessages([]);
      return;
    }
    try {
      await loadSessionMessages(sessionId);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function handleQualityCheck(messageId: number) {
    try {
      const quality = await getTutorQualityCheck(messageId);
      setQualityChecks((current) => ({ ...current, [messageId]: quality }));
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function handleSend() {
    if (!selectedStudentId || !selectedCourseId || !question.trim()) {
      return;
    }
    setSending(true);
    setError(null);
    try {
      const response = await chatWithTutor({
        student_id: selectedStudentId,
        course_id: selectedCourseId,
        question: question.trim(),
        session_id: selectedSessionId,
        profile_id: profile?.id,
        path_id: selectedPathId,
        step_id: selectedStepId,
        resource_id: selectedResourceId,
      });
      setSelectedSessionId(response.session.id);
      setMessages((current) => [
        ...current.filter((item) => item.session_id === response.session.id),
        response.user_message,
        response.assistant_message,
      ]);
      const sessionList = await getTutorSessions({
        student_id: selectedStudentId,
        course_id: selectedCourseId,
        limit: 20,
      });
      setSessions(sessionList);
      setQuestion("");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-lg border bg-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge variant="secondary">带来源答疑</Badge>
            <h1 className="mt-3 text-3xl font-bold">智能辅导</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              围绕当前课程提问，系统会结合课程知识库、学习画像和当前学习步骤进行解释。
              回答会展示引用来源和可信状态，方便你判断是否需要教师确认。
            </p>
          </div>
          <Alert className="max-w-md">
            <AlertTitle>答疑边界</AlertTitle>
            <AlertDescription>
              系统只围绕合法课程资料和原创整理内容答疑，不会复制出版教材原文或扫描件。
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>智能辅导服务暂不可用</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <Skeleton className="h-[760px]" />
          <Skeleton className="h-[760px]" />
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

            <ProfileSummaryCard profile={profile} />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">辅导上下文</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="space-y-1 text-sm">
                  <span className="font-medium">学习路径</span>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2"
                    value={selectedPathId ?? ""}
                    onChange={(event) =>
                      void handlePathChange(event.target.value ? Number(event.target.value) : undefined)
                    }
                  >
                    <option value="">不关联路径</option>
                    {paths.map((path) => (
                      <option key={path.id} value={path.id}>
                        {path.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium">当前 step</span>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2"
                    value={selectedStepId ?? ""}
                    onChange={(event) =>
                      setSelectedStepId(event.target.value ? Number(event.target.value) : undefined)
                    }
                  >
                    <option value="">不关联 step</option>
                    {pathDetail?.steps.map((step) => (
                      <option key={step.id} value={step.id}>
                        Step {step.order_index} / {step.title}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedStep ? (
                  <p className="rounded-md border bg-background p-3 text-xs text-muted-foreground">
                    {selectedStep.objective}
                  </p>
                ) : null}
                <label className="space-y-1 text-sm">
                  <span className="font-medium">已生成资源</span>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2"
                    value={selectedResourceId ?? ""}
                    onChange={(event) =>
                      setSelectedResourceId(
                        event.target.value ? Number(event.target.value) : undefined,
                      )
                    }
                  >
                    <option value="">不关联资源</option>
                    {resources.map((resource) => (
                      <option key={resource.id} value={resource.id}>
                        {resource.title}
                      </option>
                    ))}
                  </select>
                </label>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">会话</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={selectedSessionId ?? ""}
                  onChange={(event) =>
                    void handleSessionChange(
                      event.target.value ? Number(event.target.value) : undefined,
                    )
                  }
                >
                  <option value="">新建会话</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.topic || session.title}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>
          </aside>

          <section className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">快捷问题</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {scenarios.map((scenario) => (
                  <Button
                    key={scenario.key}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuestion(scenario.sample_question)}
                    type="button"
                  >
                    {scenario.sample_question}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquareText className="h-5 w-5 text-primary" aria-hidden="true" />
                  <CardTitle className="text-base">辅导对话</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="min-h-[420px] space-y-4 rounded-lg border bg-muted/20 p-4">
                  {messages.length ? (
                    messages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        quality={qualityChecks[message.id]}
                        onQualityCheck={handleQualityCheck}
                      />
                    ))
                  ) : (
                    <div className="flex min-h-[360px] items-center justify-center text-center">
                      <div>
                        <FileQuestion className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
                        <h2 className="mt-4 text-xl font-semibold">开始一次课程答疑</h2>
                        <p className="mt-2 max-w-md text-sm text-muted-foreground">
                          建议先在知识库导入《数据库系统》示例资料，再提问“幻读”“B+树”“JOIN”等课程问题。
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <textarea
                    className="min-h-28 w-full rounded-md border bg-background p-3 text-sm"
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="输入你的数据库系统问题，例如：幻读和不可重复读有什么区别？"
                    value={question}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      答案基于原创示例知识库和引用片段生成，不复制教材原文。
                    </p>
                    <Button
                      disabled={!selectedStudentId || !selectedCourseId || !question.trim() || sending}
                      onClick={handleSend}
                      type="button"
                    >
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      {sending ? "发送中" : "发送并校验"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </div>
  );
}
