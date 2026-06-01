"use client";

import { useEffect, useState } from "react";
import { AlertCircle, BookOpen, Database, GraduationCap, Layers, LibraryBig } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCourses,
  getKnowledgePoints,
  getProfileDrafts,
  getResourceItems,
  getStudents,
} from "@/lib/api";
import type { Course, ProfileDraft, ResourceItem, Student } from "@/lib/types";

interface DatabaseSnapshot {
  students: Student[];
  courses: Course[];
  knowledgePointCount: number;
  profileDrafts: ProfileDraft[];
  resourceItems: ResourceItem[];
}

export default function DatabasePage() {
  const [data, setData] = useState<DatabaseSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setError(null);
        const [students, courses, profileDrafts, resourceItems] = await Promise.all([
          getStudents(),
          getCourses(),
          getProfileDrafts(),
          getResourceItems(),
        ]);
        const knowledgePointGroups = await Promise.all(
          courses.map((course) => getKnowledgePoints(course.id)),
        );
        setData({
          students,
          courses,
          knowledgePointCount: knowledgePointGroups.flat().length,
          profileDrafts,
          resourceItems,
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "数据底座请求失败");
      }
    }

    void loadData();
  }, []);

  const seedStudent = data?.students.find((student) => student.name === "示例学生");
  const seedCourse = data?.courses.find((course) => course.title === "数据库系统");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Badge variant="secondary">数据状态</Badge>
        <h1 className="mt-3 text-3xl font-bold">数据底座</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          查看课程、学生、画像草稿和资源占位等基础数据，确认学习平台的数据底座是否正常。
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>后端数据接口不可用</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!data && !error && (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-lg" />
          ))}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            <StatCard icon={GraduationCap} label="学生数" value={data.students.length} />
            <StatCard icon={BookOpen} label="课程数" value={data.courses.length} />
            <StatCard icon={Layers} label="知识点数" value={data.knowledgePointCount} />
            <StatCard icon={Database} label="画像草稿数" value={data.profileDrafts.length} />
            <StatCard icon={LibraryBig} label="资源占位数" value={data.resourceItems.length} />
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">默认课程</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{seedCourse?.title ?? "未找到默认课程"}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {seedCourse?.description ?? "后端启动后会自动写入默认课程 seed。"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">默认学生</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{seedStudent?.name ?? "未找到默认学生"}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {seedStudent
                    ? `${seedStudent.major} / ${seedStudent.grade_level}`
                    : "后端启动后会自动写入默认学生 seed。"}
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">数据库类型</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">SQLite</Badge>
                <p className="mt-3 text-sm text-muted-foreground">
                  数据库文件默认生成在 `apps/api/eduforge.db`，不会提交到 Git。
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">ORM</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">SQLModel</Badge>
                <p className="mt-3 text-sm text-muted-foreground">
                  当前只使用同步 Session 和基础 CRUD，后续再按需要扩展。
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
      </CardContent>
    </Card>
  );
}
