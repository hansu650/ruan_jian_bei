# ruff: noqa: E501

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
        scenarios = [
            "profile",
            "learning_path",
            "resource_note",
            "resource_mindmap",
            "resource_reading",
            "resource_practice_case",
            "resource_video_script",
            "quiz",
            "tutor",
            "safety_check",
        ]
        for scenario in scenarios:
            if f"scenario:{scenario}" in lowered:
                return scenario

        if self._contains_copyright_request(text):
            return "copyright"
        if "画像" in text:
            return "profile"
        if "学习路径" in text:
            return "learning_path"
        if "练习题" in text or "测验" in text:
            return "quiz"
        if "思维导图" in text:
            return "resource_mindmap"
        if "实操" in text or "sql" in lowered:
            return "resource_practice_case"
        if "视频" in text or "动画" in text:
            return "resource_video_script"
        if "拓展阅读" in text:
            return "resource_reading"
        if "讲义" in text or "资源" in text:
            return "resource_note"
        if "答疑" in text or "解释" in text:
            return "tutor"
        return "general"

    def _response_for_scenario(self, scenario: str, prompt: str) -> str:
        if scenario == "copyright" or self._contains_copyright_request(prompt):
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
                    "title": "数据库系统 7 天个性化学习路径",
                    "goal": "掌握数据库系统课程重点，优先补齐 JOIN、事务隔离级别和 B+树索引。",
                    "target_days": 7,
                    "strategy_summary": (
                        "先补薄弱点，再串联基础概念，最后进行综合复习。"
                        "本阶段只推荐资源类型，不生成资源正文。"
                    ),
                    "weak_points": ["JOIN", "事务隔离级别", "B+树索引", "查询优化"],
                    "recommended_resource_types": [
                        "lecture_note",
                        "mindmap",
                        "quiz",
                        "reading",
                        "practice_case",
                        "video_script",
                    ],
                    "steps": [
                        {
                            "order_index": 1,
                            "title": "第 1 步：SQL 基础与 JOIN",
                            "objective": "补齐连接条件、多表查询和子查询的常见误区。",
                            "knowledge_points": ["SQL 基础", "JOIN 与子查询"],
                            "prerequisite": "了解 SELECT 基本语法",
                            "estimated_minutes": 120,
                            "recommended_resource_types": [
                                "lecture_note",
                                "quiz",
                                "practice_case",
                            ],
                            "recommended_activity": "先看案例，再总结 JOIN 规则，并完成练习题。",
                            "mastery_threshold": 80,
                        },
                        {
                            "order_index": 2,
                            "title": "第 2 步：事务与并发控制",
                            "objective": "区分脏读、不可重复读、幻读和隔离级别。",
                            "knowledge_points": ["事务与并发控制"],
                            "prerequisite": "理解数据库读写操作",
                            "estimated_minutes": 120,
                            "recommended_resource_types": [
                                "lecture_note",
                                "mindmap",
                                "video_script",
                            ],
                            "recommended_activity": "用并发异常案例理解隔离级别。",
                            "mastery_threshold": 80,
                        },
                        {
                            "order_index": 3,
                            "title": "第 3 步：索引与 B+ 树",
                            "objective": "理解范围查询、最左前缀、回表和索引失效。",
                            "knowledge_points": ["索引与 B+ 树"],
                            "prerequisite": "了解表和查询条件",
                            "estimated_minutes": 120,
                            "recommended_resource_types": ["mindmap", "quiz", "practice_case"],
                            "recommended_activity": "用查询案例解释索引选择。",
                            "mastery_threshold": 80,
                        },
                        {
                            "order_index": 4,
                            "title": "第 4 步：查询优化综合复习",
                            "objective": "结合执行计划和索引策略优化查询。",
                            "knowledge_points": ["查询优化"],
                            "prerequisite": "完成 SQL 与索引复习",
                            "estimated_minutes": 120,
                            "recommended_resource_types": ["reading", "practice_case", "quiz"],
                            "recommended_activity": "对比慢查询和优化后查询。",
                            "mastery_threshold": 80,
                        },
                        {
                            "order_index": 5,
                            "title": "第 5 步：综合复盘",
                            "objective": "把 SQL、事务、索引和优化串成考前复习闭环。",
                            "knowledge_points": ["综合复习"],
                            "prerequisite": "完成前四步",
                            "estimated_minutes": 120,
                            "recommended_resource_types": ["quiz", "lecture_note"],
                            "recommended_activity": "用错题清单检查薄弱点。",
                            "mastery_threshold": 85,
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
        if scenario == "resource_mindmap":
            return (
                "```mermaid\n"
                "mindmap\n"
                "  root((数据库系统学习资源))\n"
                "    概念理解\n"
                "    案例演示\n"
                "    练习验证\n"
                "```"
            )
        if scenario == "resource_reading":
            return "# 拓展阅读\n\n围绕课程知识库片段继续查找合法公开资料，并记录自己的理解。"
        if scenario == "resource_practice_case":
            return "```sql\nSELECT s.name, c.title FROM student s JOIN course c ON 1 = 1;\n```"
        if scenario == "resource_video_script":
            return "# 视频脚本\n\n镜头 1：提出问题。\n镜头 2：展示表结构。\n镜头 3：总结规则。"
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
            return self._tutor_response(prompt)
        if scenario == "safety_check":
            return json.dumps({"safe": True, "issues": [], "suggestion": "通过"}, ensure_ascii=False)

        return (
            "这是 EduForge MockLLM 的离线演示回复。当前阶段只验证 Provider 抽象、Prompt "
            "模板和调用日志，不调用真实外部 API，也不代表最终大模型效果。"
        )

    def _tutor_response(self, prompt: str) -> str:
        if self._contains_copyright_request(prompt):
            return COPYRIGHT_WARNING
        upper = prompt.upper()
        if "幻读" in prompt:
            return (
                "## 直接回答\n"
                "幻读是同一事务内按相同范围条件查询时，结果行集合发生变化；不可重复读更关注同一行的值发生变化。\n\n"
                "## 通俗解释\n"
                "不可重复读像一条记录变了，幻读像满足条件的记录多了或少了。\n\n"
                "## 示例\n"
                "事务 A 查询分数大于 60 的记录，事务 B 插入一条满足条件的记录并提交，事务 A 再查时多出一行，就是幻读。\n\n"
                "## 易错提醒\n"
                "不要把行值变化和范围结果集变化混在一起。\n\n"
                "## 推荐下一步\n"
                "建议复习事务隔离级别比较表，并完成并发异常判断题。\n\n"
                "引用来源：示例知识库 chunk"
            )
        if "B+树" in prompt or "B+ 树" in prompt:
            return (
                "## 直接回答\n"
                "B+树适合范围查询，因为叶子节点有序并通过链表相连，树高较低，定位起点后可以顺序扫描。\n\n"
                "## 示例\n"
                "查询 id BETWEEN 100 AND 200 时，先定位到 100 附近叶子节点，再沿叶子链表读取。\n\n"
                "## 易错提醒\n"
                "索引并不让所有查询变快，不符合最左前缀或选择性太低时效果会下降。\n\n"
                "引用来源：示例知识库 chunk"
            )
        if "JOIN" in upper:
            return (
                "## 直接回答\n"
                "JOIN 用来组合多张表。INNER JOIN 只保留两边匹配记录，LEFT JOIN 保留左表全部记录。\n\n"
                "## 示例\n"
                "学生表 LEFT JOIN 成绩表时，没有成绩的学生仍会出现；INNER JOIN 只显示有匹配成绩的学生。\n\n"
                "## 易错提醒\n"
                "漏写连接条件会产生笛卡尔积。\n\n"
                "引用来源：示例知识库 chunk"
            )
        return (
            "## 直接回答\n"
            "可以先回到课程知识库中的定义，再结合具体查询、事务或索引场景理解。\n\n"
            "## 推荐下一步\n"
            "建议生成一份讲义或练习题资源继续巩固。\n\n"
            "引用来源：示例知识库 chunk"
        )

    def _contains_copyright_request(self, text: str) -> bool:
        return any(
            keyword in text
            for keyword in [
                "复制教材原文",
                "教材 PDF",
                "教材PDF",
                "上传教材 PDF",
                "上传教材PDF",
                "扫描版教材",
                "整本书原文",
                "出版教材原文",
                "提取整本书原文",
                "输出扫描件内容",
            ]
        )
