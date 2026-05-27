import json

from app.llm.base import LLMProvider

COPYRIGHT_WARNING = (
    "我不能复制出版教材原文、扫描版教材或受版权保护资料。"
    "请使用合法资料、团队原创整理内容、公开许可资料，或确认用户上传资料具有合法使用权。"
)


class MockLLMProvider(LLMProvider):
    provider_name = "mock"
    uses_mock = True

    def __init__(
        self,
        model_name: str = "mock-edu-model",
        fallback_reason: str | None = None,
    ) -> None:
        self.model_name = model_name or "mock-edu-model"
        self.fallback_reason = fallback_reason

    def generate(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.2,
    ) -> str:
        del temperature
        merged = f"{system_prompt or ''}\n{prompt}"
        scenario = self._detect_scenario(merged)
        return self._response_for_scenario(scenario, merged)

    def chat(self, messages: list[dict[str, str]], temperature: float = 0.2) -> str:
        del temperature
        merged = "\n".join(
            f"{message.get('role', 'user')}: {message.get('content', '')}" for message in messages
        )
        scenario = self._detect_scenario(merged)
        return self._response_for_scenario(scenario, merged)

    def status(self) -> dict[str, str | bool | None]:
        return {
            "provider": self.provider_name,
            "model": self.model_name,
            "configured": True,
            "uses_mock": True,
            "warning": self.fallback_reason or "当前使用 MockLLMProvider，不调用真实外部 API。",
        }

    def _detect_scenario(self, text: str) -> str:
        lowered = text.lower()
        for scenario in [
            "profile",
            "learning_path",
            "resource_note",
            "quiz",
            "tutor",
            "safety_check",
        ]:
            if f"scenario:{scenario}" in lowered or f"场景：{scenario}" in text:
                return scenario

        copyright_keywords = ["复制教材原文", "教材 PDF", "扫描版教材", "整本书原文"]
        if any(keyword in text for keyword in copyright_keywords):
            return "copyright"
        if "画像" in text:
            return "profile"
        if "学习路径" in text:
            return "learning_path"
        if "练习题" in text or "测验" in text:
            return "quiz"
        if "讲义" in text or "资源" in text:
            return "resource_note"
        if "答疑" in text or "解释" in text:
            return "tutor"
        return "general"

    def _response_for_scenario(self, scenario: str, prompt: str) -> str:
        if scenario == "copyright":
            return COPYRIGHT_WARNING
        copyright_keywords = ["复制教材原文", "教材 PDF", "扫描版教材", "整本书原文"]
        if any(keyword in prompt for keyword in copyright_keywords):
            return COPYRIGHT_WARNING
        if scenario == "profile":
            return json.dumps(
                {
                    "major": "计算机科学与技术",
                    "learning_goal": "7天掌握数据库系统期末重点",
                    "knowledge_base": "SQL基础中等，事务和索引薄弱",
                    "learning_preference": ["例题", "图解", "实操案例"],
                    "cognitive_style": "案例驱动型",
                    "weak_points": ["JOIN", "事务隔离级别", "B+树索引", "查询优化"],
                    "time_constraint": "每天2小时",
                    "mastery": {"SQL基础": 70, "JOIN": 45, "事务": 35, "索引": 30},
                    "profile_summary": "该学生适合先通过例题和图解补齐事务与索引等薄弱点。",
                },
                ensure_ascii=False,
                indent=2,
            )
        if scenario == "learning_path":
            return json.dumps(
                {
                    "title": "数据库系统 7 天冲刺路径",
                    "steps": [
                        {
                            "day": 1,
                            "topic": "SQL 基础与 JOIN",
                            "resource": "SQL 基础讲义 + JOIN 例题",
                            "duration_minutes": 120,
                            "mastery_standard": "能解释 INNER JOIN 与 LEFT JOIN 的差异",
                        },
                        {
                            "day": 2,
                            "topic": "事务隔离级别",
                            "resource": "事务并发异常图解",
                            "duration_minutes": 120,
                            "mastery_standard": "能区分脏读、不可重复读和幻读",
                        },
                        {
                            "day": 3,
                            "topic": "索引与 B+ 树",
                            "resource": "B+ 树思维导图与范围查询案例",
                            "duration_minutes": 120,
                            "mastery_standard": "能说明最左前缀和回表",
                        },
                    ],
                },
                ensure_ascii=False,
                indent=2,
            )
        if scenario == "quiz":
            return json.dumps(
                {
                    "questions": [
                        {
                            "type": "single_choice",
                            "stem": "以下哪种并发异常描述的是范围查询结果集合发生变化？",
                            "options": ["脏读", "不可重复读", "幻读", "回表"],
                            "answer": "幻读",
                            "explanation": "幻读关注满足同一条件的行集合变化。",
                        },
                        {
                            "type": "short_answer",
                            "stem": "简述为什么 B+ 树适合数据库索引。",
                            "answer": "层高低、叶子节点有序、适合范围查询并贴合磁盘页读写。",
                        },
                    ]
                },
                ensure_ascii=False,
                indent=2,
            )
        if scenario == "resource_note":
            return (
                "# 事务隔离级别速记讲义\n\n"
                "## 学习目标\n"
                "- 区分脏读、不可重复读和幻读。\n"
                "- 理解读已提交、可重复读和串行化的取舍。\n\n"
                "## 核心解释\n"
                "事务隔离级别决定并发事务彼此可见的程度。隔离越强，一致性风险越低，"
                "但并发性能通常越受影响。\n\n"
                "## 例题提示\n"
                "如果同一范围查询第二次多出一行，应优先判断为幻读。"
            )
        if scenario == "tutor":
            return (
                "可以把幻读理解为“同一个条件查两次，行集合变了”。例如第一次查询分数低于 60 "
                "的学生有 3 人，另一个事务插入并提交了一名低分学生后，第二次查询变成 4 人。\n\n"
                "引用来源：示例知识库 chunk：07_transaction.md / 事务与并发控制。"
            )
        if scenario == "safety_check":
            return json.dumps(
                {"safe": True, "issues": [], "suggestion": "通过"},
                ensure_ascii=False,
            )

        return (
            "这是 EduForge MockLLM 的离线演示回复。当前阶段只验证 Provider 抽象、Prompt "
            "模板和调用日志，不调用真实外部 API，也不代表最终大模型效果。"
        )
