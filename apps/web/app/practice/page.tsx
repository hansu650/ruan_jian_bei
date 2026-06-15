"use client";

import { ClipboardCheck, FileText, Loader2, Target, Trophy } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LiveModelWarning } from "@/components/live-model-warning";
import { MarkdownPreview } from "@/components/markdown-preview";
import { MetricCard } from "@/components/metric-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  generateQuiz,
  getCourses,
  getDemoStatus,
  getLearningPath,
  getLearningPaths,
  getPracticeQuizzes,
  getProfileSummary,
  getQuestionTypes,
  getStudents,
  submitQuiz,
} from "@/lib/api";
import type {
  Course,
  LearnerProfile,
  LearningPath,
  LearningPathDetailResponse,
  LLMModeInfo,
  PracticeQuestion,
  PracticeQuiz,
  QuestionTypeInfo,
  Student,
  SubmitQuizResponse,
} from "@/lib/types";

type AnswerState = Record<number, Record<string, unknown>>;

const QUESTION_TYPE_LABELS: Record<string, string> = {
  single_choice: "单选题",
  multiple_choice: "多选题",
  short_answer: "简答题",
  sql_practice: "SQL 实操题",
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

function InlineBadges({ values }: { values: string[] }) {
  if (!values.length) {
    return <p className="text-sm text-muted-foreground">暂无</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <Badge key={value} variant="outline">
          {value}
        </Badge>
      ))}
    </div>
  );
}

function SuggestionList({ values }: { values: string[] }) {
  if (!values.length) {
    return <p className="text-sm text-muted-foreground">暂无补救建议。</p>;
  }
  return (
    <ul className="space-y-2 text-sm leading-6 text-slate-700">
      {values.map((value) => (
        <li key={value} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          {value}
        </li>
      ))}
    </ul>
  );
}

function MasteryPreview({ before, after }: { before: string; after: string }) {
  const beforeMap = safeJson<Record<string, number>>(before, {});
  const afterMap = safeJson<Record<string, number>>(after, {});
  const names = Array.from(new Set([...Object.keys(beforeMap), ...Object.keys(afterMap)]));
  if (!names.length) {
    return <p className="text-sm text-muted-foreground">暂无掌握度变化。</p>;
  }
  return (
    <div className="space-y-3">
      {names.map((name) => {
        const next = Number(afterMap[name] ?? beforeMap[name] ?? 0);
        const previous = Number(beforeMap[name] ?? 0);
        return (
          <div key={name} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>{name}</span>
              <span>
                {previous} → {next}
              </span>
            </div>
            <Progress value={next} />
          </div>
        );
      })}
    </div>
  );
}

function QuestionBlock({
  question,
  answer,
  onChange,
}: {
  question: PracticeQuestion;
  answer: Record<string, unknown> | undefined;
  onChange: (value: Record<string, unknown>) => void;
}) {
  const options = safeJson<Array<{ key: string; text: string }>>(question.options_json, []);
  const selectedMultiple = Array.isArray(answer?.answers) ? (answer.answers as string[]) : [];

  if (question.question_type === "single_choice") {
    return (
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.key}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm transition hover:border-sky-200 hover:bg-sky-50/40"
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              checked={answer?.answer === option.key}
              onChange={() => onChange({ answer: option.key })}
            />
            <span className="font-medium">{option.key}.</span>
            <span>{option.text}</span>
          </label>
        ))}
      </div>
    );
  }

  if (question.question_type === "multiple_choice") {
    return (
      <div className="space-y-2">
        {options.map((option) => {
          const checked = selectedMultiple.includes(option.key);
          return (
            <label
              key={option.key}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm transition hover:border-sky-200 hover:bg-sky-50/40"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  const next = checked
                    ? selectedMultiple.filter((item) => item !== option.key)
                    : [...selectedMultiple, option.key];
                  onChange({ answers: next });
                }}
              />
              <span className="font-medium">{option.key}.</span>
              <span>{option.text}</span>
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <textarea
      className="min-h-28 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:border-sky-300 focus:outline-none"
      placeholder={question.question_type === "sql_practice" ? "输入 SQL，不会被执行" : "输入你的解释"}
      value={String(answer?.text ?? answer?.sql ?? "")}
      onChange={(event) =>
        onChange(
          question.question_type === "sql_practice"
            ? { sql: event.target.value }
            : { text: event.target.value },
        )
      }
    />
  );
}

export default function PracticePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>();
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>();
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [pathDetail, setPathDetail] = useState<LearningPathDetailResponse | null>(null);
  const [selectedPathId, setSelectedPathId] = useState<number | undefined>();
  const [selectedStepId, setSelectedStepId] = useState<number | undefined>();
  const [questionTypes, setQuestionTypes] = useState<QuestionTypeInfo[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "single_choice",
    "multiple_choice",
    "short_answer",
    "sql_practice",
  ]);
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(6);
  const [quizzes, setQuizzes] = useState<PracticeQuiz[]>([]);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [result, setResult] = useState<SubmitQuizResponse | null>(null);
  const [llmMode, setLlmMode] = useState<LLMModeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedQuiz = useMemo(() => quizzes[0] ?? null, [quizzes]);

  const refreshSelection = useCallback(async (studentId: number, courseId: number) => {
    const [summary, pathList, typeList] = await Promise.all([
      getProfileSummary(studentId, courseId),
      getLearningPaths({ student_id: studentId, course_id: courseId }),
      getQuestionTypes(),
    ]);
    setProfile(summary.profile ?? null);
    setPaths(pathList);
    setQuestionTypes(typeList);
    const path = pathList[0];
    setSelectedPathId(path?.id);
    if (path) {
      const detail = await getLearningPath(path.id);
      setPathDetail(detail);
      const stepId = detail.steps[0]?.id;
      setSelectedStepId(stepId);
      if (stepId) {
        const quizList = await getPracticeQuizzes({
          student_id: studentId,
          course_id: courseId,
          step_id: stepId,
        });
        setQuizzes(quizList);
      }
    } else {
      setPathDetail(null);
      setSelectedStepId(undefined);
      setQuizzes([]);
    }
    setQuestions([]);
    setAnswers({});
    setResult(null);
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentList, courseList, demoStatus] = await Promise.all([
        getStudents(),
        getCourses(),
        getDemoStatus(),
      ]);
      setStudents(studentList);
      setCourses(courseList);
      setLlmMode(demoStatus.llm_mode);
      const defaultStudent = studentList.find((item) => item.name.includes("示例")) ?? studentList[0];
      const defaultCourse = courseList.find((item) => item.title.includes("数据库")) ?? courseList[0];
      if (defaultStudent && defaultCourse) {
        setSelectedStudentId(defaultStudent.id);
        setSelectedCourseId(defaultCourse.id);
        await refreshSelection(defaultStudent.id, defaultCourse.id);
      }
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [refreshSelection]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  async function handlePathChange(pathId: number) {
    if (!selectedStudentId || !selectedCourseId) {
      return;
    }
    setSelectedPathId(pathId);
    const detail = await getLearningPath(pathId);
    setPathDetail(detail);
    const stepId = detail.steps[0]?.id;
    setSelectedStepId(stepId);
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setQuizzes(
      stepId
        ? await getPracticeQuizzes({
            student_id: selectedStudentId,
            course_id: selectedCourseId,
            step_id: stepId,
          })
        : [],
    );
  }

  async function handleGenerate() {
    if (!selectedStudentId || !selectedCourseId || !selectedStepId) {
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const response = await generateQuiz({
        student_id: selectedStudentId,
        course_id: selectedCourseId,
        path_id: selectedPathId,
        step_id: selectedStepId,
        difficulty,
        question_count: questionCount,
        question_types: selectedTypes,
      });
      setQuizzes([response.quiz, ...quizzes]);
      setQuestions(response.questions);
      setAnswers({});
      setResult(null);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit() {
    if (!selectedStudentId || !selectedQuiz) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await submitQuiz({
        student_id: selectedStudentId,
        quiz_id: selectedQuiz.id,
        answers: questions.map((question) => ({
          question_id: question.id,
          answer: answers[question.id] ?? {},
        })),
      });
      setResult(response);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-36" />
        <Skeleton className="h-96" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-lg border bg-card p-6">
        <Badge variant="secondary">练习与诊断</Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">练习测验</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">
          根据你的学习路径生成小测。提交答案后，系统会给出得分、错因分析、掌握度变化和补救建议。
        </p>
      </section>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>请求失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">测验配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="block text-sm">
              <span className="font-medium">学生</span>
              <select
                className="mt-1 w-full rounded-md border bg-background p-2"
                value={selectedStudentId ?? ""}
                onChange={(event) => {
                  const id = Number(event.target.value);
                  setSelectedStudentId(id);
                  if (selectedCourseId) void refreshSelection(id, selectedCourseId);
                }}
              >
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="font-medium">课程</span>
              <select
                className="mt-1 w-full rounded-md border bg-background p-2"
                value={selectedCourseId ?? ""}
                onChange={(event) => {
                  const id = Number(event.target.value);
                  setSelectedCourseId(id);
                  if (selectedStudentId) void refreshSelection(selectedStudentId, id);
                }}
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </label>

            {!profile ? (
              <Alert>
                <AlertTitle>还没有学习画像</AlertTitle>
                <AlertDescription>
                  请先到 <Link href="/profile" className="font-medium underline">/profile</Link> 生成画像。
                </AlertDescription>
              </Alert>
            ) : (
              <div className="rounded-md border p-3 text-sm">
                <p className="font-medium">画像目标</p>
                <p className="mt-1 text-muted-foreground">{profile.learning_goal || "待补充"}</p>
              </div>
            )}

            {!paths.length ? (
              <Alert>
                <AlertTitle>还没有学习路径</AlertTitle>
                <AlertDescription>
                  请先到 <Link href="/learning-path" className="font-medium underline">/learning-path</Link> 生成路径。
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <label className="block text-sm">
                  <span className="font-medium">学习路径</span>
                  <select
                    className="mt-1 w-full rounded-md border bg-background p-2"
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

                <label className="block text-sm">
                  <span className="font-medium">学习步骤</span>
                  <select
                    className="mt-1 w-full rounded-md border bg-background p-2"
                    value={selectedStepId ?? ""}
                    onChange={(event) => setSelectedStepId(Number(event.target.value))}
                  >
                    {pathDetail?.steps.map((step) => (
                      <option key={step.id} value={step.id}>
                        {step.order_index}. {step.title}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}

            <label className="block text-sm">
              <span className="font-medium">难度</span>
              <select
                className="mt-1 w-full rounded-md border bg-background p-2"
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
              >
                <option value="easy">基础巩固</option>
                <option value="medium">期末常规</option>
                <option value="hard">提高挑战</option>
              </select>
            </label>

            <label className="block text-sm">
              <span className="font-medium">题目数量</span>
              <input
                type="number"
                min={4}
                max={12}
                className="mt-1 w-full rounded-md border bg-background p-2"
                value={questionCount}
                onChange={(event) => setQuestionCount(Number(event.target.value))}
              />
            </label>

            <div>
              <p className="text-sm font-medium">题型</p>
              <div className="mt-2 space-y-2">
                {questionTypes.map((type) => (
                  <label key={type.key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type.key)}
                      onChange={() =>
                        setSelectedTypes((current) =>
                          current.includes(type.key)
                            ? current.filter((item) => item !== type.key)
                            : [...current, type.key],
                        )
                      }
                    />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <LiveModelWarning mode={llmMode} compact />

            <Button
              className="w-full"
              disabled={!profile || !selectedStepId || generating}
              onClick={() => void handleGenerate()}
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
              生成练习
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">测验题目</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {!questions.length ? (
                <div className="flex min-h-64 items-center justify-center rounded-md border text-center text-sm text-muted-foreground">
                  请选择学习路径步骤后生成练习。
                </div>
              ) : (
                questions.map((question) => (
                  <div key={question.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{QUESTION_TYPE_LABELS[question.question_type] ?? question.question_type}</Badge>
                      <Badge variant="secondary">{question.knowledge_point}</Badge>
                      <span className="text-xs text-muted-foreground">{question.score} 分</span>
                    </div>
                    <p className="mb-3 text-sm font-medium leading-6">
                      {question.order_index}. {question.stem}
                    </p>
                    <QuestionBlock
                      question={question}
                      answer={answers[question.id]}
                      onChange={(value) =>
                        setAnswers((current) => ({
                          ...current,
                          [question.id]: value,
                        }))
                      }
                    />
                  </div>
                ))
              )}

              {questions.length ? (
                <Button disabled={submitting} onClick={() => void handleSubmit()}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  提交答案并自动批改
                </Button>
              ) : null}
            </CardContent>
          </Card>

          {result ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">批改结果</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 md:grid-cols-3">
                  <MetricCard
                    label="得分"
                    value={`${result.attempt.total_score}/${result.attempt.max_score}`}
                    helper="本次小测得分"
                    icon={Trophy}
                    tone={result.attempt.accuracy >= 0.8 ? "success" : "warning"}
                  />
                  <MetricCard
                    label="准确率"
                    value={`${Math.round(result.attempt.accuracy * 100)}%`}
                    helper="用于更新掌握度"
                    icon={Target}
                    tone={result.attempt.accuracy >= 0.8 ? "success" : "warning"}
                  />
                  <MetricCard
                    label="评估报告"
                    value={result.evaluation_report_id ? `#${result.evaluation_report_id}` : "已生成"}
                    helper="可到学习评估页继续查看"
                    icon={FileText}
                  />
                </div>

                <Alert variant="success">
                  <AlertTitle>学习诊断反馈</AlertTitle>
                  <AlertDescription>系统已根据本次小测整理出薄弱点和补救建议。</AlertDescription>
                </Alert>
                <MarkdownPreview content={result.attempt.feedback_summary} />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="font-semibold text-slate-950">本次暴露的薄弱点</h3>
                    <div className="mt-3">
                      <InlineBadges values={safeJson<string[]>(result.attempt.weak_points_json, [])} />
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="font-semibold text-slate-950">建议下一步</h3>
                    <div className="mt-3">
                      <SuggestionList values={safeJson<string[]>(result.attempt.recommended_actions_json, [])} />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold">掌握度变化</h3>
                  <MasteryPreview
                    before={result.attempt.mastery_before_json}
                    after={result.attempt.mastery_after_json}
                  />
                </div>

                <div className="space-y-2">
                  {result.answers.map((answer) => (
                    <div key={answer.id} className="rounded-md border p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={answer.is_correct ? "success" : "warning"}>
                          {answer.score_awarded}/{answer.max_score}
                        </Badge>
                        <span>{answer.related_knowledge_point}</span>
                      </div>
                      <div className="mt-2">
                        <MarkdownPreview content={answer.feedback} emptyDescription="暂无本题反馈。" />
                      </div>
                      {answer.mistake_reason ? (
                        <p className="mt-1 text-amber-700">{answer.mistake_reason}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>
    </main>
  );
}
