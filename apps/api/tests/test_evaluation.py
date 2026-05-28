import json
from typing import Any
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app

PROFILE_SAMPLE = (
    "我是大二计科学生，数据库要期末考试了。SQL 基础还行，但是 JOIN、事务隔离级别、"
    "索引和 B+ 树不太会。每天能学 2 小时，希望 7 天过一遍重点。我喜欢例题、图解和实操。"
)


def _default_course_id(client: TestClient) -> int:
    response = client.get("/api/courses")
    assert response.status_code == 200
    return int(response.json()[0]["id"])


def _create_student(client: TestClient) -> int:
    suffix = uuid4().hex[:8]
    response = client.post(
        "/api/students",
        json={
            "name": f"评估测试学生-{suffix}",
            "major": "计算机科学与技术",
            "grade_level": "大二",
            "email": f"evaluation-{suffix}@example.com",
        },
    )
    assert response.status_code == 201
    return int(response.json()["id"])


def _prepare_quiz(client: TestClient) -> tuple[int, int, int, int]:
    student_id = _create_student(client)
    course_id = _default_course_id(client)
    import_response = client.post(f"/api/courses/{course_id}/documents/import-sample")
    assert import_response.status_code == 200
    profile_response = client.post(
        "/api/learner-profiles/chat",
        json={"student_id": student_id, "course_id": course_id, "message": PROFILE_SAMPLE},
    )
    assert profile_response.status_code == 200
    path_response = client.post(
        "/api/learning-paths/generate",
        json={"student_id": student_id, "course_id": course_id, "target_days": 7},
    )
    assert path_response.status_code == 200
    step_id = int(path_response.json()["steps"][0]["id"])
    quiz_response = client.post(
        "/api/practice/quizzes/generate",
        json={"student_id": student_id, "course_id": course_id, "step_id": step_id},
    )
    assert quiz_response.status_code == 200
    return (
        student_id,
        course_id,
        int(quiz_response.json()["quiz"]["id"]),
        int(profile_response.json()["profile"]["id"]),
    )


def _answers_for_questions(questions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    answers: list[dict[str, Any]] = []
    for question in questions:
        qtype = question["question_type"]
        answer: dict[str, Any]
        if qtype == "single_choice":
            answer = {"answer": "B"}
        elif qtype == "multiple_choice":
            answer = {"answers": ["A", "B"]}
        elif qtype == "sql_practice":
            answer = {
                "sql": (
                    "SELECT s.name, c.title, e.score FROM student s "
                    "JOIN enrollment e ON s.id=e.student_id "
                    "JOIN course c ON c.id=e.course_id"
                )
            }
        else:
            answer = {"text": "幻读关注范围查询结果集变化，不可重复读关注同一行记录值变化。"}
        answers.append({"question_id": question["id"], "answer": answer})
    return answers


def test_submit_quiz_grades_answers_and_updates_profile() -> None:
    with TestClient(app) as client:
        student_id, course_id, quiz_id, profile_id = _prepare_quiz(client)
        profile_before = client.get(f"/api/learner-profiles/{profile_id}").json()
        quiz_detail = client.get(f"/api/practice/quizzes/{quiz_id}")
        answers = _answers_for_questions(quiz_detail.json()["questions"])
        response = client.post(
            "/api/evaluation/attempts/submit",
            json={"student_id": student_id, "quiz_id": quiz_id, "answers": answers},
        )
        attempt_id = response.json()["attempt"]["id"]
        detail = client.get(f"/api/evaluation/attempts/{attempt_id}")
        attempts = client.get("/api/evaluation/attempts", params={"student_id": student_id})
        reports = client.get("/api/evaluation/reports", params={"student_id": student_id})
        analytics = client.get(
            "/api/evaluation/analytics",
            params={"student_id": student_id, "course_id": course_id},
        )
        profile_after = client.get(f"/api/learner-profiles/{profile_id}").json()
        practice_runs = client.get("/api/agent-runs", params={"agent_name": "PracticeAgent"})
        evaluator_runs = client.get("/api/agent-runs", params={"agent_name": "EvaluatorAgent"})

    assert quiz_detail.status_code == 200
    assert response.status_code == 200
    data = response.json()
    assert data["attempt"]["total_score"] >= 0
    assert data["attempt"]["max_score"] > 0
    assert 0 <= data["attempt"]["accuracy"] <= 1
    assert len(data["answers"]) == len(answers)
    assert data["evaluation_report_id"] is not None
    assert data["updated_profile_id"] == profile_id
    assert json.loads(profile_before["mastery_json"]) != json.loads(profile_after["mastery_json"])
    assert detail.status_code == 200
    assert detail.json()["questions"]
    assert "correct_answer_json" in detail.json()["questions"][0]
    assert attempts.status_code == 200
    assert reports.status_code == 200
    assert analytics.status_code == 200
    assert analytics.json()["attempt_count"] >= 1
    assert analytics.json()["latest_report"] is not None
    assert practice_runs.status_code == 200
    assert evaluator_runs.status_code == 200
    assert any(run["agent_name"] == "PracticeAgent" for run in practice_runs.json())
    assert any(run["agent_name"] == "EvaluatorAgent" for run in evaluator_runs.json())


def test_evaluation_invalid_inputs() -> None:
    with TestClient(app) as client:
        student_id, _, quiz_id, _ = _prepare_quiz(client)
        missing_quiz = client.post(
            "/api/evaluation/attempts/submit",
            json={"student_id": student_id, "quiz_id": 999999, "answers": []},
        )
        missing_student = client.post(
            "/api/evaluation/attempts/submit",
            json={"student_id": 999999, "quiz_id": quiz_id, "answers": []},
        )
        empty_answers = client.post(
            "/api/evaluation/attempts/submit",
            json={"student_id": student_id, "quiz_id": quiz_id, "answers": []},
        )

    assert missing_quiz.status_code == 404
    assert missing_student.status_code in {400, 404}
    assert empty_answers.status_code == 400
