"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, Plus, UserRound } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createProfileDraft,
  createStudent,
  getCourses,
  getProfileDrafts,
  getStudents,
} from "@/lib/api";
import type { Course, ProfileDraft, ProfileDraftCreate, Student, StudentCreate } from "@/lib/types";

const fieldClass =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [drafts, setDrafts] = useState<ProfileDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentForm, setStudentForm] = useState<StudentCreate>({
    name: "",
    major: "计算机科学与技术",
    grade_level: "大二",
    email: "",
  });
  const [draftForm, setDraftForm] = useState<ProfileDraftCreate>({
    student_id: 0,
    course_id: 0,
    goal: "7 天掌握数据库系统期末重点",
    background: "SQL 基础中等，事务和索引薄弱",
    weak_points_json: '["JOIN", "事务隔离级别"]',
    preferences_json: '["例题", "图解"]',
    mastery_json: '{"SQL基础":70,"JOIN":45}',
    notes: "第三阶段手动创建的画像草稿。",
  });

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [studentList, courseList, draftList] = await Promise.all([
        getStudents(),
        getCourses(),
        getProfileDrafts(),
      ]);
      setStudents(studentList);
      setCourses(courseList);
      setDrafts(draftList);
      setDraftForm((current) => ({
        ...current,
        student_id: current.student_id || studentList[0]?.id || 0,
        course_id: current.course_id || courseList[0]?.id || 0,
      }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "学生数据请求失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleCreateStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await createStudent({
        ...studentForm,
        email: studentForm.email || null,
      });
      setStudentForm({
        name: "",
        major: "计算机科学与技术",
        grade_level: "大二",
        email: "",
      });
      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "创建学生失败");
    }
  }

  async function handleCreateDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await createProfileDraft({
        ...draftForm,
        notes: draftForm.notes || null,
      });
      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "创建画像草稿失败");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Badge variant="warning">学生管理</Badge>
        <h1 className="mt-3 text-3xl font-bold">学生与画像草稿</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          当前画像草稿只保存手动输入的目标、背景、薄弱点和偏好，不调用大模型生成画像。
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>操作失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <Skeleton className="h-80 rounded-lg" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserRound className="h-5 w-5 text-primary" aria-hidden="true" />
                  学生列表
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {students.map((student) => (
                  <div key={student.id} className="rounded-md border bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{student.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {student.major} / {student.grade_level}
                        </p>
                      </div>
                      <Badge variant="outline">ID {student.id}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {student.email || "未填写邮箱"}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">画像草稿</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {drafts.map((draft) => (
                  <div key={draft.id} className="rounded-md border bg-background p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">学生 {draft.student_id}</Badge>
                      <Badge variant="outline">课程 {draft.course_id}</Badge>
                    </div>
                    <p className="mt-3 font-semibold">{draft.goal}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {draft.background}
                    </p>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                      <JsonText label="薄弱点" value={draft.weak_points_json} />
                      <JsonText label="偏好" value={draft.preferences_json} />
                      <JsonText label="掌握度" value={draft.mastery_json} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">创建学生</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-3" onSubmit={(event) => void handleCreateStudent(event)}>
                  <input
                    className={fieldClass}
                    placeholder="姓名"
                    value={studentForm.name}
                    onChange={(event) =>
                      setStudentForm({ ...studentForm, name: event.target.value })
                    }
                    required
                  />
                  <input
                    className={fieldClass}
                    placeholder="专业"
                    value={studentForm.major}
                    onChange={(event) =>
                      setStudentForm({ ...studentForm, major: event.target.value })
                    }
                    required
                  />
                  <input
                    className={fieldClass}
                    placeholder="年级"
                    value={studentForm.grade_level}
                    onChange={(event) =>
                      setStudentForm({ ...studentForm, grade_level: event.target.value })
                    }
                    required
                  />
                  <input
                    className={fieldClass}
                    placeholder="邮箱"
                    type="email"
                    value={studentForm.email ?? ""}
                    onChange={(event) =>
                      setStudentForm({ ...studentForm, email: event.target.value })
                    }
                  />
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    创建学生
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">创建画像草稿</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-3" onSubmit={(event) => void handleCreateDraft(event)}>
                  <select
                    className={fieldClass}
                    value={draftForm.student_id}
                    onChange={(event) =>
                      setDraftForm({ ...draftForm, student_id: Number(event.target.value) })
                    }
                    required
                  >
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className={fieldClass}
                    value={draftForm.course_id}
                    onChange={(event) =>
                      setDraftForm({ ...draftForm, course_id: Number(event.target.value) })
                    }
                    required
                  >
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                  <input
                    className={fieldClass}
                    placeholder="学习目标"
                    value={draftForm.goal}
                    onChange={(event) => setDraftForm({ ...draftForm, goal: event.target.value })}
                    required
                  />
                  <textarea
                    className={fieldClass}
                    placeholder="学习背景"
                    value={draftForm.background}
                    onChange={(event) =>
                      setDraftForm({ ...draftForm, background: event.target.value })
                    }
                    required
                  />
                  <textarea
                    className={fieldClass}
                    placeholder='薄弱点 JSON，例如 ["JOIN"]'
                    value={draftForm.weak_points_json}
                    onChange={(event) =>
                      setDraftForm({ ...draftForm, weak_points_json: event.target.value })
                    }
                  />
                  <textarea
                    className={fieldClass}
                    placeholder='偏好 JSON，例如 ["图解"]'
                    value={draftForm.preferences_json}
                    onChange={(event) =>
                      setDraftForm({ ...draftForm, preferences_json: event.target.value })
                    }
                  />
                  <textarea
                    className={fieldClass}
                    placeholder='掌握度 JSON，例如 {"SQL":70}'
                    value={draftForm.mastery_json}
                    onChange={(event) =>
                      setDraftForm({ ...draftForm, mastery_json: event.target.value })
                    }
                  />
                  <textarea
                    className={fieldClass}
                    placeholder="备注"
                    value={draftForm.notes ?? ""}
                    onChange={(event) =>
                      setDraftForm({ ...draftForm, notes: event.target.value })
                    }
                  />
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    创建画像草稿
                  </Button>
                </form>
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}

function JsonText({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-2">
      <p className="font-medium text-foreground">{label}</p>
      <p className="mt-1 break-all">{value}</p>
    </div>
  );
}
