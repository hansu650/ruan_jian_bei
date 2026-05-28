import json
from collections import defaultdict
from typing import Any

from sqlmodel import Session

from app.agents.base import AgentResult
from app.db.models import LearnerProfile, PracticeQuestion, PracticeQuiz
from app.schemas.llm import LLMGenerateRequest
from app.schemas.practice import SubmitAnswerItem
from app.services.llm_service import generate_text


class EvaluatorAgent:
    agent_name = "EvaluatorAgent"

    def run(
        self,
        *,
        quiz: PracticeQuiz,
        questions: list[PracticeQuestion],
        submitted_answers: list[SubmitAnswerItem],
        learner_profile: LearnerProfile | None,
        session: Session,
    ) -> AgentResult:
        answer_map = {item.question_id: item.answer for item in submitted_answers}
        mastery_before = self._loads_dict(learner_profile.mastery_json if learner_profile else "{}")
        graded_answers: list[dict[str, Any]] = []
        total_score = 0
        max_score = 0
        per_point: dict[str, list[float]] = defaultdict(list)

        for question in questions:
            if question.id not in answer_map:
                continue
            result = self._grade_question(question, answer_map[question.id])
            graded_answers.append(result)
            total_score += int(result["score_awarded"])
            max_score += int(result["max_score"])
            if result["max_score"]:
                per_point[str(result["related_knowledge_point"])].append(
                    float(result["score_awarded"]) / float(result["max_score"])
                )

        mastery_after, mastery_delta, weak_points, strengths = self._update_mastery(
            mastery_before,
            per_point,
        )
        accuracy = float(total_score / max_score) if max_score else 0.0
        recommended_actions = self._recommended_actions(weak_points)
        feedback_summary = self._feedback_summary(accuracy, weak_points, strengths)
        llm_log_id: int | None = None
        latency_ms: int | None = None
        llm_hint = "EvaluatorAgent 使用规则批改完成。本次未使用额外模型反馈。"
        try:
            llm_response = generate_text(
                LLMGenerateRequest(
                    prompt=json.dumps(
                        {
                            "quiz_id": quiz.id,
                            "accuracy": accuracy,
                            "weak_points": weak_points,
                            "strengths": strengths,
                            "recommended_actions": recommended_actions,
                        },
                        ensure_ascii=False,
                    ),
                    scenario="evaluation",
                    temperature=0.2,
                ),
                session,
            )
            llm_log_id = llm_response.log_id
            latency_ms = llm_response.latency_ms
            llm_hint = llm_response.content[:500]
        except Exception:
            pass
        parsed = {
            "attempt_summary": {
                "total_score": total_score,
                "max_score": max_score,
                "accuracy": accuracy,
            },
            "answers": graded_answers,
            "mastery_before": mastery_before,
            "mastery_after": mastery_after,
            "mastery_delta": mastery_delta,
            "weak_points": weak_points,
            "strengths": strengths,
            "recommended_actions": recommended_actions,
            "feedback_summary": feedback_summary,
            "evaluation_report": {
                "title": f"{quiz.title} 学习效果评估",
                "overall_score": round(accuracy * 100, 2),
                "summary": feedback_summary,
                "weak_points": weak_points,
                "strengths": strengths,
                "mastery_delta": mastery_delta,
                "recommended_resources": recommended_actions,
                "next_plan_suggestion": (
                    "优先完成薄弱知识点的补救资源，再进行一次针对性测验。"
                    if weak_points
                    else "保持当前节奏，进入下一学习路径步骤。"
                ),
            },
            "llm_evaluation_hint": llm_hint,
        }
        return AgentResult(
            content=json.dumps(parsed, ensure_ascii=False),
            parsed=parsed,
            llm_log_id=llm_log_id,
            latency_ms=latency_ms,
        )

    def _grade_question(self, question: PracticeQuestion, answer: dict[str, Any]) -> dict[str, Any]:
        correct = self._loads_dict(question.correct_answer_json)
        qtype = question.question_type
        score = 0
        max_score = question.score
        is_correct = False
        feedback = ""
        mistake_reason = ""

        if qtype == "single_choice":
            expected = str(correct.get("answer", "")).strip().upper()
            actual = str(answer.get("answer", "")).strip().upper()
            is_correct = bool(expected and actual == expected)
            score = max_score if is_correct else 0
            feedback = "单选题匹配正确。" if is_correct else f"正确选项是 {expected}。"
            mistake_reason = "" if is_correct else "概念判断或选项辨析不够准确。"
        elif qtype == "multiple_choice":
            expected_set = {str(item).strip().upper() for item in correct.get("answers", [])}
            actual_set = {str(item).strip().upper() for item in answer.get("answers", [])}
            is_correct = bool(expected_set and actual_set == expected_set)
            if is_correct:
                score = max_score
                feedback = "多选题完全正确。"
            elif expected_set & actual_set:
                score = max_score // 2
                feedback = f"部分命中，正确答案是 {sorted(expected_set)}。"
                mistake_reason = "多选题存在漏选或误选。"
            else:
                score = 0
                feedback = f"正确答案是 {sorted(expected_set)}。"
                mistake_reason = "核心判断未命中。"
        elif qtype == "short_answer":
            keywords = [str(item).lower() for item in correct.get("keywords", [])]
            text = json.dumps(answer, ensure_ascii=False).lower()
            hit_count = sum(1 for keyword in keywords if keyword and keyword.lower() in text)
            if keywords and hit_count == len(keywords):
                score = max_score
            elif keywords and hit_count > 0:
                score = max(1, round(max_score * hit_count / len(keywords)))
            is_correct = score >= max_score * 0.8
            feedback = f"命中 {hit_count}/{len(keywords)} 个关键点。"
            mistake_reason = "" if is_correct else "简答题需要补充关键概念和边界条件。"
        elif qtype == "sql_practice":
            keywords = [str(item).upper() for item in correct.get("keywords", [])]
            text = json.dumps(answer, ensure_ascii=False).upper()
            hit_count = sum(1 for keyword in keywords if keyword and keyword in text)
            score = round(max_score * hit_count / len(keywords)) if keywords else 0
            is_correct = score >= max_score * 0.8
            feedback = f"SQL 关键词命中 {hit_count}/{len(keywords)}。本阶段不执行学生 SQL。"
            mistake_reason = "" if is_correct else "SQL 结构、表名或连接条件需要继续检查。"
        else:
            feedback = "未知题型，暂按 0 分处理。"
            mistake_reason = "题型不受支持。"

        return {
            "question_id": question.id,
            "answer": answer,
            "is_correct": is_correct,
            "score_awarded": int(score),
            "max_score": int(max_score),
            "feedback": feedback,
            "mistake_reason": mistake_reason,
            "related_knowledge_point": question.knowledge_point or "综合知识点",
        }

    def _update_mastery(
        self,
        mastery_before: dict[str, Any],
        per_point: dict[str, list[float]],
    ) -> tuple[dict[str, int], dict[str, int], list[str], list[str]]:
        mastery_after = {
            str(key): int(value) if isinstance(value, int | float) else 50
            for key, value in mastery_before.items()
        }
        mastery_delta: dict[str, int] = {}
        weak_points: list[str] = []
        strengths: list[str] = []
        for point, scores in per_point.items():
            if not scores:
                continue
            accuracy = sum(scores) / len(scores)
            old_value = int(mastery_after.get(point, 50))
            if accuracy >= 0.8:
                delta = 8
                strengths.append(point)
            elif accuracy >= 0.5:
                delta = 3
            else:
                delta = -5
                weak_points.append(point)
            new_value = max(0, min(100, old_value + delta))
            mastery_after[point] = new_value
            mastery_delta[point] = new_value - old_value
        return mastery_after, mastery_delta, weak_points, strengths

    def _recommended_actions(self, weak_points: list[str]) -> list[str]:
        if not weak_points:
            return ["完成下一学习路径步骤，并保留错题复盘习惯。"]
        return [
            f"复习 {point} 的讲义、图解和实操案例，再完成一组补救练习。"
            for point in weak_points
        ]

    def _feedback_summary(
        self,
        accuracy: float,
        weak_points: list[str],
        strengths: list[str],
    ) -> str:
        if accuracy >= 0.8:
            return "本次测验整体表现较好，可以进入下一阶段，同时保留少量错题复盘。"
        if weak_points:
            return f"本次测验暴露出 {', '.join(weak_points)} 等薄弱点，建议先完成补救资源再复测。"
        if strengths:
            return f"本次测验已有 {', '.join(strengths)} 等优势点，但仍需提高稳定性。"
        return "本次测验信息较少，建议补全答案后再次评估。"

    def _loads_dict(self, value: str) -> dict[str, Any]:
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return {}
        return parsed if isinstance(parsed, dict) else {}
