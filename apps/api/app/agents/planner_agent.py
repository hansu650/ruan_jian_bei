import json
import re
from typing import Any

from sqlmodel import Session

from app.agents.base import AgentResult
from app.db.models import Course, DocumentChunk, KnowledgePoint, LearnerProfile, Student
from app.schemas.llm import LLMGenerateRequest
from app.services.llm_service import generate_text

RESOURCE_TYPES = ["lecture_note", "mindmap", "quiz", "reading", "practice_case", "video_script"]
COPYRIGHT_WARNING = "系统只使用合法资料和原创整理内容规划学习路径，不复制出版教材原文或扫描件。"


class PlannerAgent:
    agent_name = "PlannerAgent"

    def run(
        self,
        *,
        student: Student,
        course: Course,
        learner_profile: LearnerProfile,
        knowledge_points: list[KnowledgePoint],
        document_chunk_summaries: list[DocumentChunk] | None,
        target_days: int,
        session: Session,
    ) -> AgentResult:
        profile = self._profile_to_dict(learner_profile)
        prompt = self._build_prompt(
            student=student,
            course=course,
            profile=profile,
            knowledge_points=knowledge_points,
            document_chunk_summaries=document_chunk_summaries or [],
            target_days=target_days,
        )
        response = generate_text(
            LLMGenerateRequest(prompt=prompt, scenario="learning_path", temperature=0.2),
            session,
        )
        parsed = self._parse_plan_json(response.content)
        if parsed is None or len(parsed.get("steps", [])) < 5:
            parsed = self._fallback_plan(
                course=course,
                profile=profile,
                knowledge_points=knowledge_points,
                target_days=target_days,
            )
        parsed = self._ensure_weak_point_coverage(parsed, profile, target_days, course)
        return AgentResult(
            content=parsed["strategy_summary"],
            parsed=parsed,
            llm_log_id=response.log_id,
            latency_ms=response.latency_ms,
        )

    def _build_prompt(
        self,
        *,
        student: Student,
        course: Course,
        profile: dict[str, Any],
        knowledge_points: list[KnowledgePoint],
        document_chunk_summaries: list[DocumentChunk],
        target_days: int,
    ) -> str:
        kp_payload = [
            {
                "title": item.title,
                "chapter": item.chapter,
                "order_index": item.order_index,
                "difficulty": item.difficulty,
                "summary": item.summary,
            }
            for item in knowledge_points
        ]
        chunk_payload = [
            {
                "section_title": chunk.section_title,
                "content_preview": chunk.content[:160],
            }
            for chunk in document_chunk_summaries[:8]
        ]
        return (
            "你是 EduForge 的 PlannerAgent，只负责生成个性化学习路径。\n"
            "请返回严格 JSON，不要返回 Markdown。必须包含 title, goal, target_days, "
            "strategy_summary, weak_points, recommended_resource_types, steps。\n"
            "steps 中每项必须包含 order_index, title, objective, knowledge_points, prerequisite, "
            "estimated_minutes, recommended_resource_types, recommended_activity, "
            "mastery_threshold。\n"
            "本阶段只推荐资源类型，不生成讲义、题目、实操案例或视频脚本正文。\n"
            "不得复制出版教材原文，不得要求上传教材 PDF，不得编造教材来源。\n"
            f"学生：{student.name}，专业：{student.major}，年级：{student.grade_level}\n"
            f"课程：{course.title}\n"
            f"目标天数：{target_days}\n"
            f"学习画像：{json.dumps(profile, ensure_ascii=False)}\n"
            f"课程知识点：{json.dumps(kp_payload, ensure_ascii=False)}\n"
            f"文档片段摘要：{json.dumps(chunk_payload, ensure_ascii=False)}"
        )

    def _parse_plan_json(self, content: str) -> dict[str, Any] | None:
        text = content.strip()
        if not text:
            return None
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?", "", text, flags=re.IGNORECASE).strip()
            text = re.sub(r"```$", "", text).strip()
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            text = text[start : end + 1]
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            return None
        if not isinstance(parsed, dict):
            return None
        return self._normalize_plan(parsed)

    def _fallback_plan(
        self,
        *,
        course: Course,
        profile: dict[str, Any],
        knowledge_points: list[KnowledgePoint],
        target_days: int,
    ) -> dict[str, Any]:
        weak_points = self._normalize_list(profile.get("weak_points"))
        preferences = self._normalize_list(profile.get("learning_preference"))
        minutes = self._minutes_per_step(str(profile.get("time_constraint") or ""), target_days)
        catalog = {item.title: item.title for item in knowledge_points}
        step_blueprints = [
            (
                "数据库基础与关系模型",
                "建立数据库系统、关系模型和完整性约束的基础框架",
                ["数据库基础", "关系模型"],
            ),
            (
                "SQL 基础与 JOIN",
                "补齐 SELECT 查询、连接条件、JOIN 与子查询的常见错误",
                ["SQL 基础", "JOIN 与子查询"],
            ),
            (
                "ER 建模与范式",
                "理解 ER 图转换、函数依赖和范式判断",
                ["ER 建模", "函数依赖与范式"],
            ),
            (
                "事务与并发控制",
                "重点区分 ACID、隔离级别、脏读、不可重复读和幻读",
                ["事务与并发控制"],
            ),
            (
                "索引与 B+ 树",
                "掌握聚簇索引、非聚簇索引、范围查询、回表和最左前缀",
                ["索引与 B+ 树"],
            ),
            ("查询优化", "理解执行计划、索引选择、谓词过滤和常见优化策略", ["查询优化"]),
            (
                "综合复习与模拟测验",
                "串联 SQL、范式、事务、索引和查询优化，形成考前复习闭环",
                ["综合复习"],
            ),
        ]
        ordered = self._prioritize_steps(step_blueprints, weak_points)
        steps: list[dict[str, Any]] = []
        max_steps = max(5, min(8, target_days))
        for index, (title, objective, points) in enumerate(ordered[:max_steps], start=1):
            matched_points = [catalog.get(point, point) for point in points]
            steps.append(
                {
                    "order_index": index,
                    "title": f"第 {index} 步：{title}",
                    "objective": objective,
                    "knowledge_points": matched_points,
                    "prerequisite": (
                        "完成前一步核心概念梳理" if index > 1 else "已具备课程基本学习环境"
                    ),
                    "estimated_minutes": minutes,
                    "recommended_resource_types": self._resource_types_for_step(title, preferences),
                    "recommended_activity": self._activity_for_step(title, preferences, profile),
                    "mastery_threshold": 80,
                }
            )
        strategy = self._strategy_summary(profile, weak_points, target_days)
        return self._normalize_plan(
            {
                "title": f"{course.title} {target_days} 天个性化学习路径",
                "goal": str(profile.get("learning_goal") or f"完成 {course.title} 阶段化复习"),
                "target_days": target_days,
                "strategy_summary": strategy,
                "weak_points": weak_points,
                "recommended_resource_types": self._merge_resource_types(
                    [step["recommended_resource_types"] for step in steps]
                ),
                "steps": steps,
            }
        )

    def _ensure_weak_point_coverage(
        self,
        plan: dict[str, Any],
        profile: dict[str, Any],
        target_days: int,
        course: Course,
    ) -> dict[str, Any]:
        weak_points = self._normalize_list(profile.get("weak_points")) or self._normalize_list(
            plan.get("weak_points")
        )
        plan["weak_points"] = weak_points
        steps = list(plan.get("steps") or [])
        text = json.dumps(steps, ensure_ascii=False)
        missing = [point for point in weak_points if not self._contains_weak_point(text, point)]
        if missing:
            next_index = len(steps) + 1
            for point in missing:
                steps.append(
                    {
                        "order_index": next_index,
                        "title": f"第 {next_index} 步：补齐{point}",
                        "objective": f"针对画像薄弱点 {point} 做专项巩固",
                        "knowledge_points": [self._weak_point_to_knowledge_point(point)],
                        "prerequisite": "完成前置基础复习",
                        "estimated_minutes": self._minutes_per_step(
                            str(profile.get("time_constraint") or ""),
                            target_days,
                        ),
                        "recommended_resource_types": [
                            "lecture_note",
                            "mindmap",
                            "quiz",
                            "practice_case",
                        ],
                        "recommended_activity": "先看案例，再总结规则，并用练习题检验掌握度。",
                        "mastery_threshold": 80,
                    }
                )
                next_index += 1
        plan["steps"] = steps[:8] if len(steps) > 8 else steps
        plan["title"] = str(plan.get("title") or f"{course.title} {target_days} 天个性化学习路径")
        plan["target_days"] = target_days
        if self._contains_copyright_request(profile):
            plan["strategy_summary"] = f"{COPYRIGHT_WARNING}{plan['strategy_summary']}"
        return self._normalize_plan(plan)

    def _profile_to_dict(self, profile: LearnerProfile) -> dict[str, Any]:
        return {
            "major": profile.major,
            "learning_goal": profile.learning_goal,
            "knowledge_base": profile.knowledge_base,
            "learning_preference": self._loads_json(profile.learning_preference_json, []),
            "cognitive_style": profile.cognitive_style,
            "weak_points": self._loads_json(profile.weak_points_json, []),
            "time_constraint": profile.time_constraint,
            "mastery": self._loads_json(profile.mastery_json, {}),
            "profile_summary": profile.profile_summary,
        }

    def _normalize_plan(self, data: dict[str, Any]) -> dict[str, Any]:
        raw_steps = data.get("steps")
        steps = raw_steps if isinstance(raw_steps, list) else []
        normalized_steps = [
            self._normalize_step(step, index) for index, step in enumerate(steps, start=1)
        ]
        resource_types = self._normalize_resource_types(data.get("recommended_resource_types"))
        if not resource_types:
            resource_types = self._merge_resource_types(
                [step["recommended_resource_types"] for step in normalized_steps]
            )
        return {
            "title": str(data.get("title") or "数据库系统 7 天个性化学习路径"),
            "goal": str(data.get("goal") or "补齐数据库系统核心薄弱点"),
            "target_days": int(data.get("target_days") or 7),
            "strategy_summary": str(data.get("strategy_summary") or "先补薄弱点，再做综合复习。"),
            "weak_points": self._normalize_list(data.get("weak_points")),
            "recommended_resource_types": resource_types or RESOURCE_TYPES,
            "steps": normalized_steps,
        }

    def _normalize_step(self, raw: Any, fallback_index: int) -> dict[str, Any]:
        step = raw if isinstance(raw, dict) else {}
        order_index = int(step.get("order_index") or fallback_index)
        resource_types = self._normalize_resource_types(step.get("recommended_resource_types"))
        return {
            "order_index": order_index,
            "title": str(step.get("title") or f"第 {order_index} 步：学习任务"),
            "objective": str(step.get("objective") or "完成本阶段知识点学习与练习"),
            "knowledge_points": self._normalize_list(step.get("knowledge_points"))
            or ["数据库系统"],
            "prerequisite": str(step.get("prerequisite") or ""),
            "estimated_minutes": int(step.get("estimated_minutes") or 90),
            "recommended_resource_types": resource_types or ["lecture_note", "quiz"],
            "recommended_activity": str(
                step.get("recommended_activity") or "阅读讲义后完成练习题。"
            ),
            "mastery_threshold": int(step.get("mastery_threshold") or 80),
        }

    def _prioritize_steps(
        self,
        blueprints: list[tuple[str, str, list[str]]],
        weak_points: list[str],
    ) -> list[tuple[str, str, list[str]]]:
        def score(item: tuple[str, str, list[str]]) -> int:
            text = " ".join([item[0], item[1], *item[2]])
            return sum(1 for point in weak_points if self._contains_weak_point(text, point))

        first = blueprints[:1]
        rest = sorted(blueprints[1:-1], key=score, reverse=True)
        return [*first, *rest, blueprints[-1]]

    def _resource_types_for_step(self, title: str, preferences: list[str]) -> list[str]:
        result = ["lecture_note", "quiz", "reading"]
        if "图解" in preferences or "B+ 树" in title or "B+树" in title:
            result.append("mindmap")
        if "例题" in preferences:
            result.append("quiz")
        if (
            "实操案例" in preferences
            or "实操" in preferences
            or "查询优化" in title
            or "JOIN" in title
        ):
            result.append("practice_case")
        if "事务" in title:
            result.append("video_script")
        return self._normalize_resource_types(result)

    def _activity_for_step(
        self,
        title: str,
        preferences: list[str],
        profile: dict[str, Any],
    ) -> str:
        prefix = "先看案例，再总结规则，" if profile.get("cognitive_style") == "案例驱动型" else ""
        if "图解" in preferences:
            prefix += "用思维导图梳理概念关系，"
        if "实操案例" in preferences or "实操" in preferences:
            prefix += "结合 SQL 或执行计划做小型实操，"
        return f"{prefix}最后用练习题验证 {title} 的掌握度。"

    def _minutes_per_step(self, time_constraint: str, target_days: int) -> int:
        if "1 小时" in time_constraint or "1小时" in time_constraint:
            return 60
        if "2 小时" in time_constraint or "2小时" in time_constraint:
            return 120
        return 90 if target_days >= 7 else 120

    def _strategy_summary(
        self,
        profile: dict[str, Any],
        weak_points: list[str],
        target_days: int,
    ) -> str:
        time_constraint = str(profile.get("time_constraint") or "按 7 天复习节奏推进")
        weak_text = "、".join(weak_points) or "课程核心知识点"
        return (
            f"按照 {target_days} 天节奏安排，结合 {time_constraint}，优先补齐 {weak_text}，"
            "再串联基础概念、典型例题和综合复习。本阶段只推荐资源类型，不生成资源正文。"
        )

    def _merge_resource_types(self, groups: list[list[str]]) -> list[str]:
        merged: list[str] = []
        for group in groups:
            for item in self._normalize_resource_types(group):
                if item not in merged:
                    merged.append(item)
        return merged

    def _normalize_resource_types(self, value: Any) -> list[str]:
        normalized = [item for item in self._normalize_list(value) if item in RESOURCE_TYPES]
        return list(dict.fromkeys(normalized))

    def _normalize_list(self, value: Any) -> list[str]:
        if value is None:
            return []
        if isinstance(value, list):
            candidates = value
        elif isinstance(value, str):
            candidates = re.split(r"[,，、;；\s]+", value)
        else:
            candidates = [value]
        result: list[str] = []
        for item in candidates:
            text = str(item).strip()
            if text and text not in result:
                result.append(text)
        return result

    def _weak_point_to_knowledge_point(self, weak_point: str) -> str:
        if "JOIN" in weak_point.upper():
            return "JOIN 与子查询"
        if "事务" in weak_point or "隔离" in weak_point:
            return "事务与并发控制"
        if "B+树" in weak_point or "B+ 树" in weak_point or "索引" in weak_point:
            return "索引与 B+ 树"
        if "查询优化" in weak_point:
            return "查询优化"
        return weak_point

    def _contains_weak_point(self, text: str, weak_point: str) -> bool:
        aliases = {
            "JOIN": ["JOIN", "连接"],
            "事务隔离级别": ["事务", "隔离"],
            "B+树索引": ["B+树", "B+ 树", "索引"],
            "查询优化": ["查询优化", "执行计划"],
        }
        candidates = aliases.get(weak_point, [weak_point])
        return any(candidate.lower() in text.lower() for candidate in candidates)

    def _contains_copyright_request(self, profile: dict[str, Any]) -> bool:
        text = json.dumps(profile, ensure_ascii=False)
        return any(
            keyword in text
            for keyword in [
                "复制教材原文",
                "教材 PDF",
                "教材PDF",
                "扫描件",
                "整本书原文",
                "出版教材原文",
            ]
        )

    def _loads_json(self, value: str, fallback: Any) -> Any:
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return fallback
