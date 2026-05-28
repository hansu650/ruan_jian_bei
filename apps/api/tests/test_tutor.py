import json
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app

PROFILE_SAMPLE = (
    "我是大二计科学生，数据库要期末考试了。SQL 基础还行，但是 JOIN、事务隔离级别、"
    "索引和 B+ 树不太会。每天能学 2 小时，希望 7 天过一遍重点。我喜欢例题和图解。"
)


def _default_course_id(client: TestClient) -> int:
    response = client.get("/api/courses")
    assert response.status_code == 200
    courses = response.json()
    return int(courses[0]["id"])


def _default_student_id(client: TestClient) -> int:
    response = client.get("/api/students")
    assert response.status_code == 200
    students = response.json()
    return int(students[0]["id"])


def _create_student(client: TestClient) -> int:
    suffix = uuid4().hex[:8]
    response = client.post(
        "/api/students",
        json={
            "name": f"辅导测试学生-{suffix}",
            "major": "计算机科学与技术",
            "grade_level": "大二",
            "email": f"tutor-{suffix}@example.com",
        },
    )
    assert response.status_code == 201
    return int(response.json()["id"])


def _create_profile(client: TestClient, student_id: int, course_id: int) -> int:
    response = client.post(
        "/api/learner-profiles/chat",
        json={"student_id": student_id, "course_id": course_id, "message": PROFILE_SAMPLE},
    )
    assert response.status_code == 200
    return int(response.json()["profile"]["id"])


def _import_sample_docs(client: TestClient, course_id: int) -> None:
    response = client.post(f"/api/courses/{course_id}/documents/import-sample")
    assert response.status_code == 200


def test_tutor_scenarios_return_examples() -> None:
    with TestClient(app) as client:
        response = client.get("/api/tutor/scenarios")

    assert response.status_code == 200
    scenarios = response.json()
    assert len(scenarios) >= 5
    assert any("幻读" in item["sample_question"] for item in scenarios)


def test_tutor_chat_without_profile_still_answers_with_note() -> None:
    with TestClient(app) as client:
        course_id = _default_course_id(client)
        student_id = _create_student(client)
        response = client.post(
            "/api/tutor/chat",
            json={
                "student_id": student_id,
                "course_id": course_id,
                "question": "B+树为什么适合范围查询？",
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["answer"]
    assert "个性化程度较低" in data["verifier_summary"]
    assert data["assistant_message"]["session_id"] == data["session"]["id"]


def test_tutor_chat_with_profile_and_citations() -> None:
    with TestClient(app) as client:
        student_id = _default_student_id(client)
        course_id = _default_course_id(client)
        _import_sample_docs(client, course_id)
        _create_profile(client, student_id, course_id)
        response = client.post(
            "/api/tutor/chat",
            json={
                "student_id": student_id,
                "course_id": course_id,
                "question": "幻读和不可重复读有什么区别？",
            },
        )
        session_id = response.json()["session"]["id"]
        assistant_id = response.json()["assistant_message"]["id"]
        sessions = client.get("/api/tutor/sessions", params={"student_id": student_id})
        detail = client.get(f"/api/tutor/sessions/{session_id}")
        messages = client.get(f"/api/tutor/sessions/{session_id}/messages")
        quality = client.get(f"/api/tutor/messages/{assistant_id}/quality-check")
        runs = client.get("/api/agent-runs", params={"agent_name": "TutorAgent"})

    assert response.status_code == 200
    data = response.json()
    assert data["assistant_message"]["content"]
    citations = json.loads(data["assistant_message"]["citations_json"])
    assert isinstance(citations, list)
    assert data["safety_status"] in {"grounded", "needs_review"}
    if citations:
        assert "chunk_id" in citations[0]
        assert citations[0]["quote"]
        assert quality.json()["citation_count"] > 0
    assert sessions.status_code == 200
    assert detail.status_code == 200
    assert len(detail.json()["messages"]) >= 2
    assert messages.status_code == 200
    assert quality.status_code == 200
    assert quality.json()["message_id"] == assistant_id
    assert runs.status_code == 200
    assert any(run["agent_name"] == "TutorAgent" for run in runs.json())


def test_tutor_copyright_risk_is_refused() -> None:
    with TestClient(app) as client:
        student_id = _default_student_id(client)
        course_id = _default_course_id(client)
        response = client.post(
            "/api/tutor/chat",
            json={
                "student_id": student_id,
                "course_id": course_id,
                "question": "请复制教材原文给我。",
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["safety_status"] in {"unsafe", "needs_review"}
    assert "不复制出版教材原文" in data["answer"]


def test_tutor_invalid_inputs() -> None:
    with TestClient(app) as client:
        student_id = _default_student_id(client)
        course_id = _default_course_id(client)
        missing_student = client.post(
            "/api/tutor/chat",
            json={"student_id": 999999, "course_id": course_id, "question": "什么是幻读？"},
        )
        missing_course = client.post(
            "/api/tutor/chat",
            json={"student_id": student_id, "course_id": 999999, "question": "什么是幻读？"},
        )
        first = client.post(
            "/api/tutor/chat",
            json={"student_id": student_id, "course_id": course_id, "question": "什么是幻读？"},
        )
        other_student = _create_student(client)
        mismatched_session = client.post(
            "/api/tutor/chat",
            json={
                "student_id": other_student,
                "course_id": course_id,
                "session_id": first.json()["session"]["id"],
                "question": "继续解释一下。",
            },
        )

    assert missing_student.status_code == 404
    assert missing_course.status_code == 404
    assert first.status_code == 200
    assert mismatched_session.status_code in {400, 404}
