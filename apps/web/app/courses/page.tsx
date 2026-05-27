"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, BookOpen, Plus } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createCourse, createKnowledgePoint, getCourses, getKnowledgePoints } from "@/lib/api";
import type { Course, CourseCreate, KnowledgePoint, KnowledgePointCreate } from "@/lib/types";

const fieldClass = "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState<CourseCreate>({
    title: "",
    subject: "计算机科学",
    semester: "2026 春季",
    description: "",
  });
  const [pointForm, setPointForm] = useState<KnowledgePointCreate>({
    title: "",
    chapter: "",
    order_index: 11,
    summary: "",
    difficulty: "medium",
    prerequisites_json: "[]",
  });

  async function loadCourses(nextSelectedId?: number) {
    setLoading(true);
    setError(null);
    try {
      const courseList = await getCourses();
      setCourses(courseList);
      const selectedId = nextSelectedId ?? selectedCourseId ?? courseList[0]?.id ?? null;
      setSelectedCourseId(selectedId);
      if (selectedId) {
        setKnowledgePoints(await getKnowledgePoints(selectedId));
      } else {
        setKnowledgePoints([]);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "课程数据请求失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function selectCourse(courseId: number) {
    setSelectedCourseId(courseId);
    setKnowledgePoints(await getKnowledgePoints(courseId));
  }

  async function handleCreateCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const course = await createCourse(courseForm);
      setCourseForm({ title: "", subject: "计算机科学", semester: "2026 春季", description: "" });
      await loadCourses(course.id);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "创建课程失败");
    }
  }

  async function handleCreateKnowledgePoint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCourseId) {
      setError("请先选择课程");
      return;
    }
    try {
      await createKnowledgePoint(selectedCourseId, pointForm);
      setPointForm({
        title: "",
        chapter: "",
        order_index: pointForm.order_index + 1,
        summary: "",
        difficulty: "medium",
        prerequisites_json: "[]",
      });
      setKnowledgePoints(await getKnowledgePoints(selectedCourseId));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "创建知识点失败");
    }
  }

  const selectedCourse = courses.find((course) => course.id === selectedCourseId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Badge variant="warning">课程管理</Badge>
        <h1 className="mt-3 text-3xl font-bold">课程与知识点</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          第三阶段只维护课程和知识点基础数据，课程资料上传和知识库检索后续再接入。
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
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="space-y-4">
            {courses.map((course) => (
              <Card key={course.id} className={course.id === selectedCourseId ? "border-primary" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="text-base">{course.title}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {course.subject} / {course.semester ?? "未设置学期"}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => void selectCourse(course.id)}>
                      查看知识点
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">{course.description}</p>
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
                  {selectedCourse?.title ?? "未选择课程"} 知识点
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {knowledgePoints.map((point) => (
                  <div key={point.id} className="rounded-md border bg-background p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{point.chapter}</Badge>
                      <Badge variant="secondary">{point.difficulty}</Badge>
                      <span className="text-sm font-semibold">{point.title}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{point.summary}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">创建课程</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-3" onSubmit={(event) => void handleCreateCourse(event)}>
                  <input
                    className={fieldClass}
                    placeholder="课程名称"
                    value={courseForm.title}
                    onChange={(event) => setCourseForm({ ...courseForm, title: event.target.value })}
                    required
                  />
                  <input
                    className={fieldClass}
                    placeholder="学科"
                    value={courseForm.subject}
                    onChange={(event) => setCourseForm({ ...courseForm, subject: event.target.value })}
                    required
                  />
                  <input
                    className={fieldClass}
                    placeholder="学期"
                    value={courseForm.semester ?? ""}
                    onChange={(event) => setCourseForm({ ...courseForm, semester: event.target.value })}
                  />
                  <textarea
                    className={fieldClass}
                    placeholder="课程描述"
                    value={courseForm.description}
                    onChange={(event) =>
                      setCourseForm({ ...courseForm, description: event.target.value })
                    }
                    required
                  />
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    创建课程
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">创建知识点</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-3" onSubmit={(event) => void handleCreateKnowledgePoint(event)}>
                  <input
                    className={fieldClass}
                    placeholder="知识点标题"
                    value={pointForm.title}
                    onChange={(event) => setPointForm({ ...pointForm, title: event.target.value })}
                    required
                  />
                  <input
                    className={fieldClass}
                    placeholder="章节"
                    value={pointForm.chapter}
                    onChange={(event) => setPointForm({ ...pointForm, chapter: event.target.value })}
                    required
                  />
                  <input
                    className={fieldClass}
                    placeholder="顺序"
                    type="number"
                    value={pointForm.order_index}
                    onChange={(event) =>
                      setPointForm({ ...pointForm, order_index: Number(event.target.value) })
                    }
                    required
                  />
                  <input
                    className={fieldClass}
                    placeholder="难度"
                    value={pointForm.difficulty}
                    onChange={(event) =>
                      setPointForm({ ...pointForm, difficulty: event.target.value })
                    }
                    required
                  />
                  <textarea
                    className={fieldClass}
                    placeholder="知识点摘要"
                    value={pointForm.summary}
                    onChange={(event) =>
                      setPointForm({ ...pointForm, summary: event.target.value })
                    }
                    required
                  />
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    创建知识点
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
