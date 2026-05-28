# ruff: noqa: E501

import json
from typing import Any

from sqlmodel import Session

from app.agents.base import AgentResult
from app.agents.citation_verifier import CitationVerifier
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

NO_SOURCE_NOTICE = "当前课程知识库未覆盖该内容，以下为通用解释，建议教师确认。"
COPYRIGHT_REFUSAL = (
    "系统只支持合法资料和团队原创整理内容，不复制出版教材原文、扫描件或未授权材料。"
    "你可以改问某个知识点的通用解释、例题思路或复习建议。"
)


class TutorAgent:
    agent_name = "TutorAgent"

    def run(
        self,
        *,
        student: Student,
        course: Course,
        question: str,
        citations: list[DocumentSearchResult],
        session: Session,
        learner_profile: LearnerProfile | None = None,
        step: LearningPathStep | None = None,
        resource: GeneratedResource | None = None,
        profile_note: str = "",
    ) -> AgentResult:
        citation_payload = self._citation_payload(citations)
        prompt = self._build_prompt(
            student=student,
            course=course,
            question=question,
            learner_profile=learner_profile,
            step=step,
            resource=resource,
            citations=citation_payload,
            profile_note=profile_note,
        )
        llm_response = generate_text(
            LLMGenerateRequest(
                prompt=prompt,
                scenario="tutor",
                temperature=0.2,
            ),
            session,
        )
        verifier = CitationVerifier()
        is_unsafe = verifier.has_copyright_risk(question)
        if is_unsafe:
            answer = COPYRIGHT_REFUSAL
            related_resource_ids: list[int] = []
        else:
            answer = self._render_answer(
                question=question,
                course=course,
                learner_profile=learner_profile,
                step=step,
                resource=resource,
                citations=citation_payload,
                llm_excerpt=llm_response.content,
                profile_note=profile_note,
            )
            related_resource_ids = [resource.id] if resource and resource.id is not None else []

        verification = verifier.verify(question=question, answer=answer, citations=citation_payload)
        parsed = {
            "answer": answer,
            "citations": citation_payload,
            "source_chunk_ids": [int(item["chunk_id"]) for item in citation_payload],
            "related_resource_ids": related_resource_ids,
            "safety_status": verification["safety_status"],
            "verifier_summary": self._merge_summary(
                str(verification["summary"]),
                profile_note,
            ),
            "confidence_score": float(verification["confidence_score"]),
            "issues": verification["issues"],
        }
        return AgentResult(
            content=answer,
            parsed=parsed,
            llm_log_id=llm_response.log_id,
            latency_ms=llm_response.latency_ms,
        )

    def _build_prompt(
        self,
        *,
        student: Student,
        course: Course,
        question: str,
        learner_profile: LearnerProfile | None,
        step: LearningPathStep | None,
        resource: GeneratedResource | None,
        citations: list[dict[str, Any]],
        profile_note: str,
    ) -> str:
        context = {
            "student": {
                "name": student.name,
                "major": student.major,
                "grade_level": student.grade_level,
            },
            "course": {
                "title": course.title,
                "subject": course.subject,
            },
            "profile": self._profile_context(learner_profile),
            "profile_note": profile_note,
            "step": self._step_context(step),
            "resource": self._resource_context(resource),
            "citations": citations,
        }
        return (
            "你是 EduForge 的 TutorAgent，只负责课程智能辅导问答。\n"
            "必须优先基于课程知识库 citations 回答，不能编造教材页码、出版社来源或复制教材原文。\n"
            "如果没有有效引用来源，必须提示：当前课程知识库未覆盖该内容，以下为通用解释，建议教师确认。\n"
            "不要做答题提交、自动批改、学习效果评估或掌握度更新。\n"
            f"学生问题：{question}\n"
            f"context={json.dumps(context, ensure_ascii=False)}"
        )

    def _render_answer(
        self,
        *,
        question: str,
        course: Course,
        learner_profile: LearnerProfile | None,
        step: LearningPathStep | None,
        resource: GeneratedResource | None,
        citations: list[dict[str, Any]],
        llm_excerpt: str,
        profile_note: str,
    ) -> str:
        notice = "" if citations else f"{NO_SOURCE_NOTICE}\n\n"
        if "幻读" in question:
            body = self._phantom_read_answer()
        elif "B+树" in question or "B+ 树" in question:
            body = self._btree_answer()
        elif "JOIN" in question.upper() or "LEFT JOIN" in question.upper():
            body = self._join_answer()
        elif "事务隔离" in question or "事务" in question:
            body = self._transaction_review_answer()
        elif "索引" in question:
            body = self._index_answer()
        else:
            body = (
                "## 直接回答\n"
                f"这个问题可以先回到《{course.title}》课程中的核心概念，再结合例子判断适用条件。\n\n"
                "## 通俗解释\n"
                "先确认问题里的对象、操作和约束，再判断它属于 SQL 查询、事务并发、索引优化还是建模设计。\n\n"
                "## 示例\n"
                "如果题目给出一段 SQL，就先看表之间的连接关系，再看 WHERE 条件和索引是否支持。\n\n"
                "## 易错提醒\n"
                "不要只背定义，要把概念放回查询、事务或索引的具体场景中验证。\n\n"
                "## 推荐下一步\n"
                "建议生成一份讲义或练习题资源，用 2-3 个小例子巩固。"
            )

        personalization = self._personalization(learner_profile, step, resource, profile_note)
        citation_text = self._citation_text(citations)
        return (
            f"{notice}{body}\n\n"
            f"{personalization}\n\n"
            "## 引用来源\n"
            f"{citation_text}\n\n"
            "<!-- MockLLM tutor excerpt: "
            f"{llm_excerpt[:120].replace('--', '')} -->"
        )

    def _phantom_read_answer(self) -> str:
        return (
            "## 直接回答\n"
            "幻读指同一个事务内两次按相同范围条件查询时，第二次看到了新增或消失的行，结果集的“行集合”发生变化。"
            "不可重复读更关注同一行数据的值被别的事务修改后，两次读取结果不同。\n\n"
            "## 通俗解释\n"
            "不可重复读像是同一张学生成绩单上的某个分数变了；幻读像是按“成绩大于 60”筛选时，第二次多出来一个学生。\n\n"
            "## 示例\n"
            "事务 A 查询 score >= 60 的选课记录有 10 行。事务 B 插入一条 score=80 的记录并提交。"
            "事务 A 再查同一范围时得到 11 行，这就是典型幻读场景。\n\n"
            "## 易错提醒\n"
            "不要把“行内容变了”和“范围结果集变了”混在一起。前者通常对应不可重复读，后者通常对应幻读。\n\n"
            "## 推荐下一步\n"
            "建议下一步看事务隔离级别对比表，再做 2 道并发异常判断题。"
        )

    def _btree_answer(self) -> str:
        return (
            "## 直接回答\n"
            "B+ 树适合数据库索引，关键原因是树高较低、内部节点只承担导航、叶子节点有序并通过链表连接，"
            "因此等值查询和范围查询都比较高效。\n\n"
            "## 通俗解释\n"
            "可以把 B+ 树看成一本带目录的词典：上层目录帮你快速定位，叶子页按顺序排好，范围查询时沿着叶子链表继续扫即可。\n\n"
            "## 示例\n"
            "查询 id BETWEEN 100 AND 200 时，数据库先通过树路径定位到 100 附近的叶子节点，再沿叶子节点链表顺序读取到 200。\n\n"
            "## 易错提醒\n"
            "B+ 树不是让所有查询都变快。若查询条件不符合最左前缀、函数包裹索引列或选择性很差，仍可能出现索引失效或全表扫描。\n\n"
            "## 推荐下一步\n"
            "建议生成 B+ 树思维导图和一个 SQL 索引实操案例，理解回表、范围查询和最左前缀。"
        )

    def _join_answer(self) -> str:
        return (
            "## 直接回答\n"
            "JOIN 用来把多张表中满足连接条件的记录组合起来。INNER JOIN 只保留两边都匹配的行，"
            "LEFT JOIN 会保留左表全部行，右表无匹配时用 NULL 补齐。\n\n"
            "## 通俗解释\n"
            "INNER JOIN 像取两个名单的交集；LEFT JOIN 像以左边名单为主，即使右边暂时没有信息，也先把左边的人保留下来。\n\n"
            "## 示例\n"
            "学生表 LEFT JOIN 成绩表时，没有成绩的学生仍会出现；INNER JOIN 则只显示已有成绩记录的学生。\n\n"
            "## 易错提醒\n"
            "最常见错误是漏写连接条件，导致笛卡尔积；或者把 LEFT JOIN 后的右表过滤条件写进 WHERE，意外变成类似 INNER JOIN 的结果。\n\n"
            "## 推荐下一步\n"
            "建议做一组 INNER JOIN / LEFT JOIN 对比题，并用小表手算结果集。"
        )

    def _transaction_review_answer(self) -> str:
        return (
            "## 直接回答\n"
            "复习事务隔离级别时，先抓住 ACID，再把脏读、不可重复读、幻读和四种隔离级别对应起来。\n\n"
            "## 通俗解释\n"
            "隔离级别越高，并发异常越少，但系统并发性能通常越受影响。\n\n"
            "## 示例\n"
            "读已提交可以避免脏读，但仍可能出现不可重复读；可重复读通常能稳定同一行的重复读取，但还要关注范围查询的幻读处理。\n\n"
            "## 易错提醒\n"
            "不要只背“从低到高”的顺序，要会根据并发异常反推需要的隔离级别。\n\n"
            "## 推荐下一步\n"
            "建议把四个隔离级别做成表格，再针对每种异常写一个两事务交错执行案例。"
        )

    def _index_answer(self) -> str:
        return (
            "## 直接回答\n"
            "判断 SQL 是否适合建索引，要看过滤条件、连接条件、排序分组字段、字段选择性以及更新成本。\n\n"
            "## 通俗解释\n"
            "索引像目录，适合帮你快速缩小搜索范围；但目录太多会增加维护成本，写入和更新也会变慢。\n\n"
            "## 示例\n"
            "如果经常按 course_id 和 student_id 查询选课记录，可以考虑组合索引；若字段取值只有男/女这种低选择性，单独建索引收益可能有限。\n\n"
            "## 易错提醒\n"
            "不要看到 WHERE 就建索引。函数包裹索引列、隐式类型转换、不符合最左前缀都可能让索引失效。\n\n"
            "## 推荐下一步\n"
            "建议结合 EXPLAIN 或执行计划做一个查询优化实操案例。"
        )

    def _citation_payload(self, citations: list[DocumentSearchResult]) -> list[dict[str, Any]]:
        payload: list[dict[str, Any]] = []
        for item in citations[:5]:
            quote = " ".join(item.content.split())[:120]
            payload.append(
                {
                    "chunk_id": item.chunk_id,
                    "document_id": item.document_id,
                    "filename": item.filename,
                    "chunk_index": item.chunk_index,
                    "section_title": item.section_title,
                    "quote": quote,
                }
            )
        return payload

    def _citation_text(self, citations: list[dict[str, Any]]) -> str:
        if not citations:
            return "- 暂无课程知识库来源。"
        return "\n".join(
            (
                f"- {item['filename']} / chunk {item['chunk_index']}"
                f"（{item.get('section_title') or '未命名小节'}）：{item['quote']}"
            )
            for item in citations
        )

    def _profile_context(self, profile: LearnerProfile | None) -> dict[str, Any] | None:
        if profile is None:
            return None
        return {
            "learning_goal": profile.learning_goal,
            "knowledge_base": profile.knowledge_base,
            "learning_preference_json": profile.learning_preference_json,
            "weak_points_json": profile.weak_points_json,
            "time_constraint": profile.time_constraint,
            "mastery_json": profile.mastery_json,
        }

    def _step_context(self, step: LearningPathStep | None) -> dict[str, Any] | None:
        if step is None:
            return None
        return {
            "title": step.title,
            "objective": step.objective,
            "knowledge_points_json": step.knowledge_points_json,
            "recommended_activity": step.recommended_activity,
        }

    def _resource_context(self, resource: GeneratedResource | None) -> dict[str, Any] | None:
        if resource is None:
            return None
        return {
            "id": resource.id,
            "resource_type": resource.resource_type,
            "title": resource.title,
            "content_preview": resource.content[:360],
        }

    def _personalization(
        self,
        profile: LearnerProfile | None,
        step: LearningPathStep | None,
        resource: GeneratedResource | None,
        profile_note: str,
    ) -> str:
        lines = ["## 个性化提示"]
        if profile is None:
            lines.append(f"- {profile_note or '未找到学习画像，个性化程度较低。'}")
        else:
            weak_points = self._json_list(profile.weak_points_json)
            preferences = self._json_list(profile.learning_preference_json)
            if weak_points:
                lines.append(f"- 结合你的薄弱点：{'、'.join(weak_points[:4])}。")
            if preferences:
                lines.append(f"- 推荐按你的偏好使用：{'、'.join(preferences[:4])}。")
            if profile.time_constraint:
                lines.append(f"- 时间安排参考：{profile.time_constraint}。")
        if step is not None:
            lines.append(f"- 当前学习步骤：{step.title}，掌握标准 {step.mastery_threshold} 分。")
        if resource is not None:
            lines.append(f"- 已选择资源：{resource.title}，可配合该资源复习。")
        return "\n".join(lines)

    def _json_list(self, value: str) -> list[str]:
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return []
        if not isinstance(parsed, list):
            return []
        return [str(item) for item in parsed if str(item).strip()]

    def _merge_summary(self, summary: str, profile_note: str) -> str:
        if profile_note and profile_note not in summary:
            return f"{summary} {profile_note}"
        return summary
