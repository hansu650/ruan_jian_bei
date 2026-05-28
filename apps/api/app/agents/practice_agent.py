# ruff: noqa: E501

import json
from typing import Any

from sqlmodel import Session

from app.agents.base import AgentResult
from app.db.models import (
    Course,
    GeneratedResource,
    LearnerProfile,
    LearningPathStep,
    Student,
)
from app.schemas.documents import DocumentSearchResult
from app.schemas.llm import LLMGenerateRequest
from app.services.llm_service import generate_text

QUESTION_TYPES = ["single_choice", "multiple_choice", "short_answer", "sql_practice"]


class PracticeAgent:
    agent_name = "PracticeAgent"

    def run(
        self,
        *,
        student: Student,
        course: Course,
        learner_profile: LearnerProfile,
        step: LearningPathStep,
        citations: list[DocumentSearchResult],
        resources: list[GeneratedResource],
        difficulty: str,
        question_count: int,
        question_types: list[str] | None,
        session: Session,
    ) -> AgentResult:
        selected_types = [item for item in (question_types or QUESTION_TYPES) if item in QUESTION_TYPES]
        if not selected_types:
            selected_types = QUESTION_TYPES

        prompt = self._build_prompt(
            student=student,
            course=course,
            learner_profile=learner_profile,
            step=step,
            citations=citations,
            resources=resources,
            difficulty=difficulty,
            question_count=question_count,
            question_types=selected_types,
        )
        llm_response = generate_text(
            LLMGenerateRequest(prompt=prompt, scenario="practice_quiz", temperature=0.2),
            session,
        )
        parsed = self._parse_or_fallback(
            llm_response.content,
            step=step,
            learner_profile=learner_profile,
            citations=citations,
            resources=resources,
            difficulty=difficulty,
            question_count=question_count,
            question_types=selected_types,
        )
        return AgentResult(
            content=json.dumps(parsed, ensure_ascii=False),
            parsed=parsed,
            llm_log_id=llm_response.log_id,
            latency_ms=llm_response.latency_ms,
        )

    def _build_prompt(
        self,
        *,
        student: Student,
        course: Course,
        learner_profile: LearnerProfile,
        step: LearningPathStep,
        citations: list[DocumentSearchResult],
        resources: list[GeneratedResource],
        difficulty: str,
        question_count: int,
        question_types: list[str],
    ) -> str:
        context = {
            "student": {
                "name": student.name,
                "major": student.major,
                "grade_level": student.grade_level,
            },
            "course": {"title": course.title, "subject": course.subject},
            "profile": {
                "learning_goal": learner_profile.learning_goal,
                "weak_points_json": learner_profile.weak_points_json,
                "mastery_json": learner_profile.mastery_json,
            },
            "step": {
                "title": step.title,
                "objective": step.objective,
                "knowledge_points_json": step.knowledge_points_json,
            },
            "resource_titles": [resource.title for resource in resources[:6]],
            "citations": [
                {
                    "chunk_id": item.chunk_id,
                    "filename": item.filename,
                    "section_title": item.section_title,
                    "content_preview": item.content[:180],
                }
                for item in citations[:5]
            ],
            "difficulty": difficulty,
            "question_count": question_count,
            "question_types": question_types,
        }
        return (
            "你是 EduForge 的 PracticeAgent，只负责生成原创练习测验。\n"
            "请根据学习画像、学习路径步骤、课程知识库片段和已生成资源，输出严格 JSON。\n"
            "必须包含 single_choice、multiple_choice、short_answer、sql_practice 等题型中的至少三类。\n"
            "不要复制教材原文，不要执行 SQL，不要调用真实外部 API。\n"
            f"context={json.dumps(context, ensure_ascii=False)}"
        )

    def _parse_or_fallback(
        self,
        raw: str,
        *,
        step: LearningPathStep,
        learner_profile: LearnerProfile,
        citations: list[DocumentSearchResult],
        resources: list[GeneratedResource],
        difficulty: str,
        question_count: int,
        question_types: list[str],
    ) -> dict[str, Any]:
        try:
            parsed = json.loads(raw)
            questions = parsed.get("questions")
            if isinstance(questions, list) and len(questions) >= 4:
                return self._normalize_quiz(
                    parsed,
                    step=step,
                    citations=citations,
                    resources=resources,
                    difficulty=difficulty,
                    question_count=question_count,
                    question_types=question_types,
                )
        except json.JSONDecodeError:
            pass
        return self._fallback_quiz(
            step=step,
            learner_profile=learner_profile,
            citations=citations,
            resources=resources,
            difficulty=difficulty,
            question_count=question_count,
            question_types=question_types,
        )

    def _normalize_quiz(
        self,
        parsed: dict[str, Any],
        *,
        step: LearningPathStep,
        citations: list[DocumentSearchResult],
        resources: list[GeneratedResource],
        difficulty: str,
        question_count: int,
        question_types: list[str],
    ) -> dict[str, Any]:
        normalized: list[dict[str, Any]] = []
        for raw_question in parsed.get("questions", []):
            if not isinstance(raw_question, dict):
                continue
            question_type = str(raw_question.get("question_type") or raw_question.get("type") or "")
            if question_type not in QUESTION_TYPES:
                continue
            normalized.append(
                {
                    "question_type": question_type,
                    "stem": str(raw_question.get("stem") or ""),
                    "options": raw_question.get("options") or [],
                    "correct_answer": raw_question.get("correct_answer")
                    or raw_question.get("answer")
                    or {},
                    "explanation": str(raw_question.get("explanation") or ""),
                    "knowledge_point": str(raw_question.get("knowledge_point") or step.title),
                    "difficulty": str(raw_question.get("difficulty") or difficulty),
                    "score": int(raw_question.get("score") or 10),
                    "citations": self._citation_payload(citations),
                }
            )
        if len(normalized) < max(4, min(question_count, 6)):
            fallback = self._fallback_questions(step, question_types, difficulty, citations)
            normalized.extend(fallback)
        return {
            "title": str(parsed.get("title") or f"{step.title} 专项练习"),
            "description": str(parsed.get("description") or "围绕当前学习路径步骤生成的个性化练习。"),
            "difficulty": str(parsed.get("difficulty") or difficulty),
            "knowledge_points": self._loads_list(step.knowledge_points_json) or [step.title],
            "source_chunk_ids": [item.chunk_id for item in citations[:5]],
            "source_resource_ids": [resource.id for resource in resources if resource.id is not None],
            "questions": normalized[:question_count],
        }

    def _fallback_quiz(
        self,
        *,
        step: LearningPathStep,
        learner_profile: LearnerProfile,
        citations: list[DocumentSearchResult],
        resources: list[GeneratedResource],
        difficulty: str,
        question_count: int,
        question_types: list[str],
    ) -> dict[str, Any]:
        weak_points = self._loads_list(learner_profile.weak_points_json)
        knowledge_points = self._loads_list(step.knowledge_points_json) or weak_points or [step.title]
        questions = self._fallback_questions(step, question_types, difficulty, citations)
        return {
            "title": f"{step.title} 个性化练习",
            "description": "根据学习路径步骤、画像薄弱点和课程知识库生成的原创测验。",
            "difficulty": difficulty,
            "knowledge_points": knowledge_points,
            "source_chunk_ids": [item.chunk_id for item in citations[:5]],
            "source_resource_ids": [resource.id for resource in resources if resource.id is not None],
            "questions": questions[:question_count],
        }

    def _fallback_questions(
        self,
        step: LearningPathStep,
        question_types: list[str],
        difficulty: str,
        citations: list[DocumentSearchResult],
    ) -> list[dict[str, Any]]:
        citations_payload = self._citation_payload(citations)
        templates = [
            {
                "question_type": "single_choice",
                "stem": "以下哪种现象描述的是幻读？",
                "options": [
                    {"key": "A", "text": "读取到另一个事务尚未提交的数据"},
                    {"key": "B", "text": "同一范围查询第二次多出或少了满足条件的记录"},
                    {"key": "C", "text": "同一行记录的字段值前后变化"},
                    {"key": "D", "text": "查询必须回表读取完整记录"},
                ],
                "correct_answer": {"answer": "B"},
                "explanation": "幻读关注范围查询的结果集变化，不可重复读关注同一行值变化。",
                "knowledge_point": "幻读",
                "difficulty": difficulty,
                "score": 10,
                "citations": citations_payload,
            },
            {
                "question_type": "multiple_choice",
                "stem": "关于 B+ 树索引，下列说法正确的有？",
                "options": [
                    {"key": "A", "text": "叶子节点通常有序连接，适合范围扫描"},
                    {"key": "B", "text": "树高较低，有利于减少磁盘页访问"},
                    {"key": "C", "text": "任何 LIKE 查询都会稳定命中索引"},
                    {"key": "D", "text": "不符合最左前缀可能导致联合索引利用不足"},
                ],
                "correct_answer": {"answers": ["A", "B", "D"]},
                "explanation": "B+ 树适合范围查询，但索引是否生效仍受查询条件和最左前缀影响。",
                "knowledge_point": "B+树索引",
                "difficulty": difficulty,
                "score": 10,
                "citations": citations_payload,
            },
            {
                "question_type": "single_choice",
                "stem": "LEFT JOIN 与 INNER JOIN 的核心区别是什么？",
                "options": [
                    {"key": "A", "text": "LEFT JOIN 保留左表不匹配记录，INNER JOIN 只保留匹配记录"},
                    {"key": "B", "text": "INNER JOIN 一定比 LEFT JOIN 慢"},
                    {"key": "C", "text": "LEFT JOIN 不需要连接条件"},
                    {"key": "D", "text": "二者查询结果永远相同"},
                ],
                "correct_answer": {"answer": "A"},
                "explanation": "连接类型决定不匹配记录是否保留，连接条件决定如何匹配。",
                "knowledge_point": "JOIN",
                "difficulty": difficulty,
                "score": 10,
                "citations": citations_payload,
            },
            {
                "question_type": "short_answer",
                "stem": "请用自己的话说明不可重复读和幻读的区别。",
                "options": [],
                "correct_answer": {"keywords": ["同一行", "范围", "结果集", "幻读"]},
                "explanation": "简答题应区分同一行值变化与范围查询结果集变化。",
                "knowledge_point": "事务隔离级别",
                "difficulty": difficulty,
                "score": 10,
                "citations": citations_payload,
            },
            {
                "question_type": "sql_practice",
                "stem": "给定 student、enrollment、course 三张表，写出查询学生姓名、课程名和成绩的 JOIN SQL。",
                "options": [],
                "correct_answer": {
                    "keywords": ["SELECT", "JOIN", "student", "course", "enrollment"],
                    "reference_sql": "SELECT s.name, c.title, e.score FROM student s JOIN enrollment e ON s.id=e.student_id JOIN course c ON c.id=e.course_id;",
                },
                "explanation": "SQL 实操题重点检查 SELECT、JOIN 和连接条件。",
                "knowledge_point": "JOIN",
                "difficulty": difficulty,
                "score": 10,
                "citations": citations_payload,
            },
            {
                "question_type": "short_answer",
                "stem": f"结合当前学习步骤“{step.title}”，说明你会如何判断一个查询是否需要建立索引。",
                "options": [],
                "correct_answer": {"keywords": ["WHERE", "范围查询", "选择性", "最左前缀", "执行计划"]},
                "explanation": "索引判断应结合过滤条件、选择性、范围扫描和执行计划。",
                "knowledge_point": "查询优化",
                "difficulty": difficulty,
                "score": 10,
                "citations": citations_payload,
            },
        ]
        preferred = [item for item in templates if item["question_type"] in question_types]
        if len(preferred) < 4:
            preferred = templates
        return preferred

    def _citation_payload(self, citations: list[DocumentSearchResult]) -> list[dict[str, Any]]:
        return [
            {
                "chunk_id": item.chunk_id,
                "document_id": item.document_id,
                "filename": item.filename,
                "chunk_index": item.chunk_index,
                "section_title": item.section_title,
                "quote_preview": " ".join(item.content.split())[:160],
            }
            for item in citations[:5]
        ]

    def _loads_list(self, value: str) -> list[str]:
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return []
        if not isinstance(parsed, list):
            return []
        return [str(item) for item in parsed if str(item).strip()]
