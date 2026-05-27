import json
import re
from typing import Any

from sqlmodel import Session

from app.agents.base import AgentResult
from app.db.models import Course, LearnerProfile, ProfileChatMessage, ProfileDraft, Student
from app.schemas.llm import LLMGenerateRequest
from app.services.llm_service import generate_text

COPYRIGHT_WARNING = "系统只支持合法资料和团队原创整理内容，不复制出版教材原文或扫描件。"


class ProfileAgent:
    agent_name = "ProfileAgent"

    def run(
        self,
        *,
        student: Student,
        course: Course,
        message: str,
        session: Session,
        existing_profile: LearnerProfile | None = None,
        profile_draft: ProfileDraft | None = None,
        recent_messages: list[ProfileChatMessage] | None = None,
    ) -> AgentResult:
        prompt = self._build_prompt(
            student=student,
            course=course,
            message=message,
            existing_profile=existing_profile,
            profile_draft=profile_draft,
            recent_messages=recent_messages or [],
        )
        response = generate_text(
            LLMGenerateRequest(prompt=prompt, scenario="profile", temperature=0.2),
            session,
        )
        parsed = self._parse_profile_json(response.content)
        if parsed is None:
            parsed = self._fallback_extract(message)

        merged = self._merge_profile(existing_profile, parsed)
        assistant_message = self._assistant_message(message, merged)
        return AgentResult(
            content=assistant_message,
            parsed=merged,
            llm_log_id=response.log_id,
            latency_ms=response.latency_ms,
        )

    def _build_prompt(
        self,
        *,
        student: Student,
        course: Course,
        message: str,
        existing_profile: LearnerProfile | None,
        profile_draft: ProfileDraft | None,
        recent_messages: list[ProfileChatMessage],
    ) -> str:
        existing = self._profile_to_dict(existing_profile) if existing_profile else {}
        draft = profile_draft.model_dump() if profile_draft else {}
        recent = [f"{item.role}: {item.content}" for item in recent_messages[-6:]]
        return (
            "你是 EduForge 的 ProfileAgent，只负责从学生自然语言中抽取学习画像。\n"
            "请返回严格 JSON，不要返回 Markdown。必须包含 major, learning_goal, "
            "knowledge_base, learning_preference, cognitive_style, weak_points, "
            "time_constraint, mastery, profile_summary。\n"
            "不得复制出版教材原文，不得要求上传教材 PDF。\n"
            f"学生：{student.name}，专业：{student.major}，年级：{student.grade_level}\n"
            f"课程：{course.title}\n"
            f"已有画像：{json.dumps(existing, ensure_ascii=False)}\n"
            f"画像草稿：{json.dumps(draft, ensure_ascii=False, default=str)}\n"
            f"最近对话：{json.dumps(recent, ensure_ascii=False)}\n"
            f"学生新消息：{message}"
        )

    def _parse_profile_json(self, content: str) -> dict[str, Any] | None:
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
        return self._normalize_profile(parsed)

    def _fallback_extract(self, message: str) -> dict[str, Any]:
        weak_points: list[str] = []
        preferences: list[str] = []
        mastery: dict[str, int] = {}
        learning_goal = ""
        time_constraint = ""

        if any(keyword in message for keyword in ["计科", "计算机"]):
            major = "计算机科学与技术"
        else:
            major = ""

        if "数据库" in message:
            learning_goal = "掌握数据库系统课程重点"
        if any(keyword in message for keyword in ["7天", "七天"]):
            learning_goal = "7天掌握数据库系统期末重点"
        if "每天" in message or "小时" in message:
            time_constraint = self._extract_time_constraint(message)

        if "SQL" in message.upper():
            mastery["SQL基础"] = 70
        if "JOIN" in message.upper():
            weak_points.append("JOIN")
            mastery["JOIN"] = 45
        if "事务" in message:
            weak_points.append("事务隔离级别")
            mastery["事务"] = 35
        if "索引" in message or "B+树" in message:
            weak_points.append("B+树索引")
            mastery["索引"] = 30
        for keyword in ["例题", "图解", "实操案例", "实操"]:
            if keyword in message:
                preferences.append("实操案例" if keyword == "实操" else keyword)

        knowledge_base = "SQL基础中等，事务和索引薄弱" if weak_points else ""
        return self._normalize_profile(
            {
                "major": major,
                "learning_goal": learning_goal,
                "knowledge_base": knowledge_base,
                "learning_preference": preferences,
                "cognitive_style": "案例驱动型",
                "weak_points": weak_points,
                "time_constraint": time_constraint,
                "mastery": mastery,
                "profile_summary": "该学生适合通过例题、图解和实操案例补齐薄弱知识点。",
            }
        )

    def _extract_time_constraint(self, message: str) -> str:
        match = re.search(r"(每天[^，。,.；;]*小时)", message)
        if match:
            return match.group(1)
        if "1 小时" in message or "1小时" in message:
            return "每天1小时"
        if "2 小时" in message or "2小时" in message:
            return "每天2小时"
        return "时间有限，需要优先安排重点"

    def _merge_profile(
        self,
        existing_profile: LearnerProfile | None,
        updates: dict[str, Any],
    ) -> dict[str, Any]:
        existing = self._profile_to_dict(existing_profile) if existing_profile else {}
        merged: dict[str, Any] = {}
        for field in [
            "major",
            "learning_goal",
            "knowledge_base",
            "cognitive_style",
            "time_constraint",
            "profile_summary",
        ]:
            value = str(updates.get(field) or "").strip()
            merged[field] = value or str(existing.get(field) or "")

        merged["learning_preference"] = self._merge_lists(
            existing.get("learning_preference"),
            updates.get("learning_preference"),
        )
        merged["weak_points"] = self._merge_lists(
            existing.get("weak_points"),
            updates.get("weak_points"),
        )
        mastery = self._normalize_mastery(existing.get("mastery"))
        mastery.update(self._normalize_mastery(updates.get("mastery")))
        merged["mastery"] = mastery
        if not merged["profile_summary"]:
            merged["profile_summary"] = "画像已根据当前对话生成，后续会随学习反馈继续更新。"
        return self._normalize_profile(merged)

    def _profile_to_dict(self, profile: LearnerProfile | None) -> dict[str, Any]:
        if profile is None:
            return {}
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

    def _assistant_message(self, message: str, profile: dict[str, Any]) -> str:
        prefix = f"{COPYRIGHT_WARNING}\n" if self._contains_copyright_request(message) else ""
        weak_points = "、".join(profile.get("weak_points") or []) or "暂未识别"
        return (
            f"{prefix}已根据你的描述更新 8 维学习画像。"
            f"当前重点薄弱点：{weak_points}。"
            "后续学习路径和资源生成会基于这份画像继续展开。"
        )

    def _contains_copyright_request(self, message: str) -> bool:
        return any(
            keyword in message
            for keyword in [
                "复制教材原文",
                "教材 PDF",
                "教材PDF",
                "扫描件",
                "整本书原文",
                "出版教材原文",
            ]
        )

    def _normalize_profile(self, data: dict[str, Any]) -> dict[str, Any]:
        return {
            "major": str(data.get("major") or ""),
            "learning_goal": str(data.get("learning_goal") or ""),
            "knowledge_base": str(data.get("knowledge_base") or ""),
            "learning_preference": self._normalize_list(data.get("learning_preference")),
            "cognitive_style": str(data.get("cognitive_style") or "案例驱动型"),
            "weak_points": self._normalize_list(data.get("weak_points")),
            "time_constraint": str(data.get("time_constraint") or ""),
            "mastery": self._normalize_mastery(data.get("mastery")),
            "profile_summary": str(data.get("profile_summary") or ""),
        }

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

    def _merge_lists(self, old: Any, new: Any) -> list[str]:
        return self._normalize_list([*self._normalize_list(old), *self._normalize_list(new)])

    def _normalize_mastery(self, value: Any) -> dict[str, int]:
        if isinstance(value, str):
            value = self._loads_json(value, {})
        if not isinstance(value, dict):
            return {}
        result: dict[str, int] = {}
        for key, raw_score in value.items():
            try:
                score = int(raw_score)
            except (TypeError, ValueError):
                continue
            result[str(key)] = max(0, min(score, 100))
        return result

    def _loads_json(self, value: str, fallback: Any) -> Any:
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return fallback
