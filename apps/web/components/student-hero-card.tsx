import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface StudentHeroCardProps {
  studentName?: string | null;
  courseTitle?: string | null;
  learningGoal?: string | null;
  nextHref: string;
  nextLabel: string;
}

export function StudentHeroCard({
  studentName,
  courseTitle,
  learningGoal,
  nextHref,
  nextLabel,
}: StudentHeroCardProps) {
  return (
    <Card className="overflow-hidden border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm">
      <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
            <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
            学生学习入口
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              学习工作台
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              面向{courseTitle ? `《${courseTitle}》` : "当前课程"}的个性化 AI 学习助手。
              系统会根据你的画像、路径和练习结果，提醒你下一步最值得做什么。
            </p>
          </div>
          <Button asChild size="lg" className="bg-sky-700 hover:bg-sky-800">
            <Link href={nextHref}>
              {nextLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-slate-500">当前学习者</p>
              <p className="font-semibold text-slate-950">{studentName || "示例学生"}</p>
            </div>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <div>
              <p className="text-slate-500">当前课程</p>
              <p className="mt-1 font-medium text-slate-900">{courseTitle || "数据库系统"}</p>
            </div>
            <div>
              <p className="text-slate-500">学习目标</p>
              <p className="mt-1 leading-6 text-slate-700">
                {learningGoal || "先完成学习画像，再生成适合你的学习计划。"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
