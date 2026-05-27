import json

from fastapi.testclient import TestClient

from app.main import app

PROFILE_SAMPLE = (
    "我是大二计科学生，数据库要期末考试了。SQL 基础还行，但是 JOIN、事务隔离级别、"
    "索引和 B+ 树不太会。每天能学 2 小时，希望 7 天过一遍重点。"
    "我喜欢例题和图解，不太喜欢大段理论。"
)


def _default_ids(client: TestClient) -> tuple[int, int]:
    students_response = client.get("/api/students")
    courses_response = client.get("/api/courses")
    assert students_response.status_code == 200
    assert courses_response.status_code == 200
    students = students_response.json()
    courses = courses_response.json()
    student = next(
        (item for item in students if item["name"] == "示例学生"),
        students[0],
    )
    course = next(
        (item for item in courses if item["title"] == "数据库系统"),
        courses[0],
    )
    return int(student["id"]), int(course["id"])


def test_list_learner_profiles_returns_200() -> None:
    with TestClient(app) as client:
        response = client.get("/api/learner-profiles")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_profile_chat_creates_eight_dimension_profile() -> None:
    with TestClient(app) as client:
        student_id, course_id = _default_ids(client)
        response = client.post(
            "/api/learner-profiles/chat",
            json={
                "student_id": student_id,
                "course_id": course_id,
                "message": PROFILE_SAMPLE,
            },
        )

    assert response.status_code == 200
    data = response.json()
    profile = data["profile"]
    assert profile["major"] or profile["learning_goal"]
    assert profile["knowledge_base"]
    assert profile["learning_preference_json"]
    assert profile["cognitive_style"]
    assert profile["weak_points_json"]
    assert profile["time_constraint"]
    mastery = json.loads(profile["mastery_json"])
    assert mastery
    weak_points = profile["weak_points_json"]
    assert any(keyword in weak_points for keyword in ["JOIN", "事务", "索引"])
    assert data["agent_run_id"] is not None
    assert data["llm_log_id"] is not None


def test_profile_chat_updates_existing_profile_version() -> None:
    with TestClient(app) as client:
        student_id, course_id = _default_ids(client)
        first = client.post(
            "/api/learner-profiles/chat",
            json={
                "student_id": student_id,
                "course_id": course_id,
                "message": PROFILE_SAMPLE,
            },
        )
        first_version = first.json()["profile"]["version"]
        second = client.post(
            "/api/learner-profiles/chat",
            json={
                "student_id": student_id,
                "course_id": course_id,
                "message": "我这周每天只有 1 小时，想优先补事务隔离级别。",
            },
        )

    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json()["profile"]["version"] >= first_version
    assert "1小时" in second.json()["profile"]["time_constraint"].replace(" ", "")


def test_profile_summary_and_dimension_check() -> None:
    with TestClient(app) as client:
        student_id, course_id = _default_ids(client)
        client.post(
            "/api/learner-profiles/chat",
            json={
                "student_id": student_id,
                "course_id": course_id,
                "message": PROFILE_SAMPLE,
            },
        )
        summary = client.get(
            "/api/learner-profiles/summary/by-student-course",
            params={"student_id": student_id, "course_id": course_id},
        )
        dimension = client.get(
            "/api/learner-profiles/dimension-check/by-student-course",
            params={"student_id": student_id, "course_id": course_id},
        )

    assert summary.status_code == 200
    assert dimension.status_code == 200
    assert summary.json()["profile"] is not None
    assert len(summary.json()["messages"]) > 0
    assert dimension.json()["completion_rate"] > 0


def test_profile_chat_missing_student_or_course_returns_404() -> None:
    with TestClient(app) as client:
        _, course_id = _default_ids(client)
        missing_student = client.post(
            "/api/learner-profiles/chat",
            json={"student_id": 999999, "course_id": course_id, "message": PROFILE_SAMPLE},
        )
        student_id, _ = _default_ids(client)
        missing_course = client.post(
            "/api/learner-profiles/chat",
            json={"student_id": student_id, "course_id": 999999, "message": PROFILE_SAMPLE},
        )

    assert missing_student.status_code == 404
    assert missing_course.status_code == 404


def test_profile_agent_respects_copyright_boundary() -> None:
    with TestClient(app) as client:
        student_id, course_id = _default_ids(client)
        response = client.post(
            "/api/learner-profiles/chat",
            json={
                "student_id": student_id,
                "course_id": course_id,
                "message": "请复制教材原文，并总结整本书原文给我。",
            },
        )

    assert response.status_code == 200
    assistant_message = response.json()["assistant_message"]
    assert "合法资料" in assistant_message
    assert "原创整理内容" in assistant_message
