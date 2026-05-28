import json
from typing import Any

from sqlmodel import Session

from app.agents.base import AgentResult
from app.db.models import Course, LearnerProfile, LearningPath, LearningPathStep, Student
from app.schemas.documents import DocumentSearchResult
from app.schemas.llm import LLMGenerateRequest
from app.services.llm_service import generate_text

RESOURCE_TYPE_DETAILS: dict[str, dict[str, str]] = {
    "lecture_note": {
        "title": "专业课程讲义",
        "description": "围绕路径步骤生成结构化 Markdown 讲义。",
        "content_format": "markdown",
        "scenario": "resource_note",
    },
    "mindmap": {
        "title": "知识点思维导图",
        "description": "用 Markdown fenced code block 保存 mermaid mindmap。",
        "content_format": "mermaid",
        "scenario": "resource_mindmap",
    },
    "quiz": {
        "title": "练习题",
        "description": "生成选择题、判断题或简答题草稿，后续由测验模块接管批改。",
        "content_format": "markdown",
        "scenario": "quiz",
    },
    "reading": {
        "title": "拓展阅读材料",
        "description": "生成延伸阅读提纲和检索建议，不复制教材原文。",
        "content_format": "markdown",
        "scenario": "resource_reading",
    },
    "practice_case": {
        "title": "SQL/代码实操案例",
        "description": "生成可演示的 SQL 或伪代码实操任务。",
        "content_format": "markdown",
        "scenario": "resource_practice_case",
    },
    "video_script": {
        "title": "短视频/动画讲解脚本",
        "description": "生成分镜式讲解脚本，供后续多模态资源扩展。",
        "content_format": "markdown",
        "scenario": "resource_video_script",
    },
}

RESOURCE_TYPES = list(RESOURCE_TYPE_DETAILS)


class ResourceAgent:
    agent_name = "ResourceAgent"

    def run(
        self,
        *,
        student: Student,
        course: Course,
        learner_profile: LearnerProfile,
        learning_path: LearningPath,
        step: LearningPathStep,
        resource_type: str,
        citations: list[DocumentSearchResult],
        session: Session,
    ) -> AgentResult:
        if resource_type not in RESOURCE_TYPE_DETAILS:
            raise ValueError(f"Unsupported resource_type: {resource_type}")

        detail = RESOURCE_TYPE_DETAILS[resource_type]
        prompt = self._build_prompt(
            student=student,
            course=course,
            learner_profile=learner_profile,
            learning_path=learning_path,
            step=step,
            resource_type=resource_type,
            citations=citations,
        )
        llm_response = generate_text(
            LLMGenerateRequest(
                prompt=prompt,
                scenario=detail["scenario"],
                temperature=0.2,
            ),
            session,
        )
        citation_payload = self._citation_payload(citations)
        content = self._render_content(
            course=course,
            learner_profile=learner_profile,
            learning_path=learning_path,
            step=step,
            resource_type=resource_type,
            citations=citation_payload,
            llm_excerpt=llm_response.content,
        )
        title = self._resource_title(step, resource_type)
        parsed = {
            "resource_type": resource_type,
            "title": title,
            "content_format": detail["content_format"],
            "content": content,
            "citations": citation_payload,
        }
        return AgentResult(
            content=content,
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
        learning_path: LearningPath,
        step: LearningPathStep,
        resource_type: str,
        citations: list[DocumentSearchResult],
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
            "profile": {
                "learning_goal": learner_profile.learning_goal,
                "knowledge_base": learner_profile.knowledge_base,
                "learning_preference_json": learner_profile.learning_preference_json,
                "weak_points_json": learner_profile.weak_points_json,
                "mastery_json": learner_profile.mastery_json,
            },
            "learning_path": {
                "title": learning_path.title,
                "goal": learning_path.goal,
                "strategy_summary": learning_path.strategy_summary,
            },
            "step": {
                "title": step.title,
                "objective": step.objective,
                "knowledge_points_json": step.knowledge_points_json,
                "recommended_activity": step.recommended_activity,
                "mastery_threshold": step.mastery_threshold,
            },
            "citations": [
                {
                    "filename": item.filename,
                    "chunk_id": item.chunk_id,
                    "section_title": item.section_title,
                    "content_preview": item.content[:220],
                }
                for item in citations[:5]
            ],
        }
        return (
            "你是 EduForge 的 ResourceAgent，只负责生成学习资源正文。\n"
            "当前阶段使用 MockLLM，不调用真实外部 API。\n"
            "请结合学生画像、学习路径步骤、课程知识点和引用片段生成资源。\n"
            "必须保留引用来源意识，不得编造教材来源，不得复制出版教材原文。\n"
            "不要实现智能辅导聊天、答题提交、自动批改或学习效果评估。\n"
            f"resource_type={resource_type}\n"
            f"context={json.dumps(context, ensure_ascii=False)}"
        )

    def _render_content(
        self,
        *,
        course: Course,
        learner_profile: LearnerProfile,
        learning_path: LearningPath,
        step: LearningPathStep,
        resource_type: str,
        citations: list[dict[str, Any]],
        llm_excerpt: str,
    ) -> str:
        knowledge_points = self._loads_list(step.knowledge_points_json)
        weak_points = self._loads_list(learner_profile.weak_points_json)
        preferences = self._loads_list(learner_profile.learning_preference_json)
        citation_lines = self._citation_lines(citations)
        if resource_type == "lecture_note":
            return self._lecture_note(
                course,
                learning_path,
                step,
                knowledge_points,
                weak_points,
                preferences,
                citation_lines,
            )
        if resource_type == "mindmap":
            return self._mindmap(step, knowledge_points, citation_lines)
        if resource_type == "quiz":
            return self._quiz(step, knowledge_points, citation_lines)
        if resource_type == "reading":
            return self._reading(step, knowledge_points, preferences, citation_lines)
        if resource_type == "practice_case":
            return self._practice_case(step, knowledge_points, citation_lines)
        if resource_type == "video_script":
            return self._video_script(step, knowledge_points, citation_lines)
        return f"{llm_excerpt}\n\n## 引用来源\n{citation_lines}"

    def _lecture_note(
        self,
        course: Course,
        learning_path: LearningPath,
        step: LearningPathStep,
        knowledge_points: list[str],
        weak_points: list[str],
        preferences: list[str],
        citation_lines: str,
    ) -> str:
        points_text = "、".join(knowledge_points) or step.title
        weak_text = "、".join(weak_points) or "当前步骤相关薄弱点"
        preference_text = "、".join(preferences) or "例题与短讲义"
        return (
            f"# {step.title} 速学讲义\n\n"
            f"课程：{course.title}\n\n"
            f"所属路径：{learning_path.title}\n\n"
            "## 学习目标\n"
            f"- 理解并能复述：{step.objective}\n"
            f"- 聚焦知识点：{points_text}\n"
            f"- 达到掌握标准：{step.mastery_threshold} 分以上。\n\n"
            "## 个性化提示\n"
            f"该学生当前薄弱点包括 {weak_text}，学习偏好为 {preference_text}。"
            "建议先看一个小例子，再总结规则，最后用题目检验。\n\n"
            "## 核心讲解\n"
            f"{points_text} 的学习重点不在于背术语，"
            "而在于能把概念放进实际查询、事务或索引场景中解释。"
            "遇到题目时先判断对象、约束和变化，再选择对应规则。\n\n"
            "## 例子\n"
            "假设一个课程系统需要查询学生选课、成绩和课程信息。先写出涉及的表，再确认连接条件或事务边界，最后检查结果是否符合业务语义。\n\n"
            "## 自检问题\n"
            "1. 我能否用自己的话解释本步骤的核心概念？\n"
            "2. 我能否指出一个常见错误并给出修正方式？\n"
            "3. 我能否把知识点应用到 SQL 或数据库设计案例中？\n\n"
            "## 引用来源\n"
            f"{citation_lines}\n"
        )

    def _mindmap(
        self,
        step: LearningPathStep,
        knowledge_points: list[str],
        citation_lines: str,
    ) -> str:
        root = self._clean_mermaid_text(step.title)
        children = knowledge_points or [step.objective]
        lines = ["```mermaid", "mindmap", f"  root(({root}))"]
        for item in children:
            lines.append(f"    {self._clean_mermaid_text(item)}")
            lines.append("      概念理解")
            lines.append("      常见误区")
            lines.append("      练习验证")
        lines.extend(["```", "", "## 引用来源", citation_lines])
        return "\n".join(lines)

    def _quiz(
        self,
        step: LearningPathStep,
        knowledge_points: list[str],
        citation_lines: str,
    ) -> str:
        primary = knowledge_points[0] if knowledge_points else step.title
        return (
            f"# {step.title} 练习题\n\n"
            "## 选择题\n"
            f"1. 关于 {primary}，下列说法更合理的是哪一项？\n"
            "   - A. 只要记住定义，不需要结合场景\n"
            "   - B. 应先判断业务场景，再选择对应规则\n"
            "   - C. 所有数据库问题都可以用同一种 SQL 写法解决\n"
            "   - D. 索引和事务不会影响查询结果理解\n\n"
            "答案：B\n\n"
            "## 判断题\n"
            "2. 学习数据库知识点时，只看结论不看反例，容易在综合题中误判。答案：正确。\n\n"
            "## 简答题\n"
            f"3. 请用一个自己的例子说明 {primary} 在数据库系统中的作用。\n\n"
            "## 引用来源\n"
            f"{citation_lines}\n"
        )

    def _reading(
        self,
        step: LearningPathStep,
        knowledge_points: list[str],
        preferences: list[str],
        citation_lines: str,
    ) -> str:
        points_text = "、".join(knowledge_points) or step.title
        preference_text = "、".join(preferences) or "短文阅读"
        return (
            f"# {step.title} 拓展阅读\n\n"
            "## 阅读方向\n"
            f"- 围绕 {points_text} 查找课程笔记、公开技术博客或数据库系统公开课资料。\n"
            "- 优先选择有例子、有图示、有 SQL 片段的材料。\n"
            f"- 结合学生偏好：{preference_text}。\n\n"
            "## 阅读问题\n"
            "1. 资料中的核心概念是否能和本项目知识库片段对应？\n"
            "2. 是否有反例或边界条件？\n"
            "3. 能否把阅读内容转成一道练习题或一个实操任务？\n\n"
            "## 版权提醒\n"
            "只使用合法资料和团队原创整理内容，不复制出版教材原文或扫描件。\n\n"
            "## 引用来源\n"
            f"{citation_lines}\n"
        )

    def _practice_case(
        self,
        step: LearningPathStep,
        knowledge_points: list[str],
        citation_lines: str,
    ) -> str:
        points_text = "、".join(knowledge_points) or step.title
        return (
            f"# {step.title} SQL/代码实操案例\n\n"
            "## 任务背景\n"
            "设计一个简化的选课系统，包含 student、course、enrollment 三张表。\n\n"
            "## 实操任务\n"
            f"目标：用实际 SQL 验证 {points_text}。\n\n"
            "```sql\n"
            "CREATE TABLE student (id INTEGER PRIMARY KEY, name TEXT, major TEXT);\n"
            "CREATE TABLE course (id INTEGER PRIMARY KEY, title TEXT);\n"
            "CREATE TABLE enrollment (student_id INTEGER, course_id INTEGER, score INTEGER);\n\n"
            "SELECT s.name, c.title, e.score\n"
            "FROM student AS s\n"
            "JOIN enrollment AS e ON s.id = e.student_id\n"
            "JOIN course AS c ON c.id = e.course_id\n"
            "WHERE e.score >= 60;\n"
            "```\n\n"
            "## 检查点\n"
            "- 连接条件是否完整？\n"
            "- 查询结果是否符合业务语义？\n"
            "- 如果加入索引或事务边界，执行和一致性会怎样变化？\n\n"
            "## 引用来源\n"
            f"{citation_lines}\n"
        )

    def _video_script(
        self,
        step: LearningPathStep,
        knowledge_points: list[str],
        citation_lines: str,
    ) -> str:
        points_text = "、".join(knowledge_points) or step.title
        return (
            f"# {step.title} 短视频/动画讲解脚本\n\n"
            "## 时长建议\n"
            "2-3 分钟。\n\n"
            "## 分镜脚本\n"
            "1. 开场：用一个学生选课或订单查询场景引出问题。\n"
            f"2. 核心概念：展示 {points_text} 的关键关系图。\n"
            "3. 动画演示：让表、事务或索引节点随步骤移动，突出变化过程。\n"
            "4. 常见误区：展示一个错误判断，再给出修正。\n"
            "5. 收尾：给出一道自测题，提醒达到掌握标准后进入下一步。\n\n"
            "## 旁白提示\n"
            f"今天只解决一个问题：{step.objective}。先看场景，再总结规则，最后用题目验证。\n\n"
            "## 引用来源\n"
            f"{citation_lines}\n"
        )

    def _resource_title(self, step: LearningPathStep, resource_type: str) -> str:
        label = RESOURCE_TYPE_DETAILS[resource_type]["title"]
        return f"{step.title} - {label}"

    def _citation_payload(self, citations: list[DocumentSearchResult]) -> list[dict[str, Any]]:
        payload: list[dict[str, Any]] = []
        for item in citations[:5]:
            payload.append(
                {
                    "chunk_id": item.chunk_id,
                    "document_id": item.document_id,
                    "filename": item.filename,
                    "chunk_index": item.chunk_index,
                    "section_title": item.section_title,
                    "quote_preview": " ".join(item.content.split())[:180],
                }
            )
        return payload

    def _citation_lines(self, citations: list[dict[str, Any]]) -> str:
        if not citations:
            return "- 暂无课程知识库引用，请先在知识库页面导入示例资料。"
        return "\n".join(
            (
                f"- {item['filename']} / chunk {item['chunk_index']}"
                f"（{item.get('section_title') or '未命名小节'}）：{item['quote_preview']}"
            )
            for item in citations
        )

    def _loads_list(self, value: str) -> list[str]:
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return []
        if not isinstance(parsed, list):
            return []
        return [str(item) for item in parsed if str(item).strip()]

    def _clean_mermaid_text(self, value: str) -> str:
        return (
            value.replace("(", "（")
            .replace(")", "）")
            .replace("[", "【")
            .replace("]", "】")
            .replace(":", "：")
            .strip()
        )
