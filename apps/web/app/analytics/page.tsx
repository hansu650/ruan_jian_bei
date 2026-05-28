"use client";

import { BarChart3, FileText } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getCourses, getEvaluationReports, getLearningAnalytics, getStudents } from "@/lib/api";
import type {
  Course,
  LearningAnalyticsSummary,
  LearningEvaluationReport,
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

function JsonBadges({ values }: { values: string[] }) {
  if (!values.length) {
    return <span className="text-sm text-muted-foreground">暂无</span>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((item) => (
        <Badge key={item} variant="outline">
          {item}
        </Badge>
      ))}
    </div>
  );
}

function MasteryList({ masteryJson }: { masteryJson: string }) {
  const mastery = safeJson<Record<string, number>>(masteryJson, {});
  const entries = Object.entries(mastery);
  if (!entries.length) {
    return <p className="text-sm text-muted-foreground">暂无掌握度数据，请先完成练习测验。</p>;
  }
  return (
    <div className="space-y-3">
      {entries.map(([name, score]) => (
        <div key={name} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>{name}</span>
            <span>{score}</span>
          </div>
          <Progress value={Number(score)} />
        </div>
      ))}
    </div>
  );
}

function ReportCard({ report }: { report: LearningEvaluationReport }) {
  const weakPoints = safeJson<string[]>(report.weak_points_json, []);
  const strengths = safeJson<string[]>(report.strengths_json, []);
  const resources = safeJson<string[]>(report.recommended_resources_json, []);
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="text-base">{report.title}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{report.created_at}</p>
          </div>
          <Badge variant={report.overall_score >= 80 ? "success" : "warning"}>
            {Math.round(report.overall_score)} 分
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="leading-6 text-muted-foreground">{report.summary}</p>
        <div>
          <p className="mb-2 font-medium">薄弱点</p>
          <JsonBadges values={weakPoints} />
        </div>
        <div>
          <p className="mb-2 font-medium">优势点</p>
          <JsonBadges values={strengths} />
        </div>
        <div>
          <p className="mb-2 font-medium">补救资源建议</p>
          <JsonBadges values={resources} />
        </div>
        <Alert>
          <AlertTitle>下一步建议</AlertTitle>
          <AlertDescription>{report.next_plan_suggestion || "继续完成下一阶段练习。"}</AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>();
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>();
  const [summary, setSummary] = useState<LearningAnalyticsSummary | null>(null);
  const [reports, setReports] = useState<LearningEvaluationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAnalytics = useCallback(async (studentId: number, courseId: number) => {
    const [nextSummary, nextReports] = await Promise.all([
      getLearningAnalytics(studentId, courseId),
      getEvaluationReports({ student_id: studentId, course_id: courseId }),
    ]);
    setSummary(nextSummary);
    setReports(nextReports);
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentList, courseList] = await Promise.all([getStudents(), getCourses()]);
      setStudents(studentList);
      setCourses(courseList);
      const defaultStudent = studentList.find((item) => item.name.includes("示例")) ?? studentList[0];
      const defaultCourse = courseList.find((item) => item.title.includes("数据库")) ?? courseList[0];
      if (defaultStudent && defaultCourse) {
        setSelectedStudentId(defaultStudent.id);
        setSelectedCourseId(defaultCourse.id);
        await refreshAnalytics(defaultStudent.id, defaultCourse.id);
      }
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [refreshAnalytics]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  async function handleSelectionChange(studentId: number, courseId: number) {
    setSelectedStudentId(studentId);
    setSelectedCourseId(courseId);
    setError(null);
    try {
      await refreshAnalytics(studentId, courseId);
    } catch (caught) {
      setError(errorMessage(caught));
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
        <Badge variant="warning">第十阶段：学习效果评估与掌握度更新</Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">学习效果评估</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">
          这里展示测验次数、平均准确率、最新掌握度、薄弱点和评估报告。当前阶段使用 MockLLM，
          不调用真实外部 API；掌握度根据测验表现动态更新。
        </p>
      </section>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>请求失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium">学生</span>
          <select
            className="mt-1 w-full rounded-md border bg-background p-2"
            value={selectedStudentId ?? ""}
            onChange={(event) => {
              const id = Number(event.target.value);
              if (selectedCourseId) void handleSelectionChange(id, selectedCourseId);
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
              if (selectedStudentId) void handleSelectionChange(selectedStudentId, id);
            }}
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">测验数</p>
            <p className="mt-2 text-2xl font-semibold">{summary?.quiz_count ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">提交次数</p>
            <p className="mt-2 text-2xl font-semibold">{summary?.attempt_count ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">平均准确率</p>
            <p className="mt-2 text-2xl font-semibold">
              {Math.round((summary?.average_accuracy ?? 0) * 100)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">最新报告</p>
            <p className="mt-2 text-2xl font-semibold">#{summary?.latest_report?.id ?? "-"}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
              最新掌握度
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MasteryList masteryJson={summary?.latest_mastery_json ?? "{}"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
              最新薄弱点与补救建议
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">薄弱点</p>
              <JsonBadges values={summary?.latest_weak_points ?? []} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">补救行动</p>
              <JsonBadges values={summary?.latest_recommended_actions ?? []} />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">评估报告</h2>
        {reports.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        ) : (
          <Alert>
            <AlertTitle>暂无评估报告</AlertTitle>
            <AlertDescription>请先到 /practice 生成测验并提交答案。</AlertDescription>
          </Alert>
        )}
      </section>
    </main>
  );
}
