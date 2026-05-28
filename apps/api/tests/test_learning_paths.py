import json
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app

PROFILE_SAMPLE = (
    "我是大二计科学生，数据库要期末考试了。SQL 基础还行，但是 JOIN、事务隔离级别、"
    "索引和 B+ 树不太会。每天能学 2 小时，希望 7 天过一遍重点。"
    "我喜欢例题和图解，不太喜欢大段理论。"
)


def _default_course_id(client: TestClient) -> int:
    response = client.get("/api/courses")
    assert response.status_code == 200
    courses = response.json()
    course = next((item for item in courses if item["title"] == "数据库系统"), courses[0])
    return int(course["id"])


def _default_student_id(client: TestClient) -> int:
    response = client.get("/api/students")
    assert response.status_code == 200
    students = response.json()
    student = next((item for item in students if item["name"] == "示例学生"), students[0])
    return int(student["id"])


def _create_profile(client: TestClient) -> tuple[int, int, int]:
    student_id = _default_student_id(client)
    course_id = _default_course_id(client)
    response = client.post(
        "/api/learner-profiles/chat",
        json={"student_id": student_id, "course_id": course_id, "message": PROFILE_SAMPLE},
    )
    assert response.status_code == 200
    profile_id = int(response.json()["profile"]["id"])
    return student_id, course_id, profile_id


def test_list_learning_paths_returns_200() -> None:
    with TestClient(app) as client:
        response = client.get("/api/learning-paths")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_generate_without_profile_returns_400() -> None:
    suffix = uuid4().hex[:8]
    with TestClient(app) as client:
        student_response = client.post(
            "/api/students",
            json={
                "name": f"无画像学生-{suffix}",
                "major": "计算机科学与技术",
                "grade_level": "大二",
                "email": f"no-profile-{suffix}@example.com",
            },
        )
        course_id = _default_course_id(client)
        response = client.post(
            "/api/learning-paths/generate",
            json={
                "student_id": student_response.json()["id"],
                "course_id": course_id,
                "target_days": 7,
            },
        )

    assert student_response.status_code == 201
    assert response.status_code == 400
    assert "请先生成学习画像" in response.text


def test_generate_learning_path_after_profile() -> None:
    with TestClient(app) as client:
        student_id, course_id, _ = _create_profile(client)
        response = client.post(
            "/api/learning-paths/generate",
            json={"student_id": student_id, "course_id": course_id, "target_days": 7},
        )
        runs_response = client.get("/api/agent-runs", params={"agent_name": "PlannerAgent"})

    assert response.status_code == 200
    data = response.json()
    assert data["path"]["id"] > 0
    assert len(data["steps"]) >= 5
    combined = json.dumps(data["steps"], ensure_ascii=False)
    assert any(keyword in combined for keyword in ["JOIN", "事务", "索引", "B+树", "B+ 树"])
    assert all(step["recommended_resource_types_json"] for step in data["steps"])
    assert data["agent_run_id"] is not None
    assert data["llm_log_id"] is not None
    assert runs_response.status_code == 200
    assert any(run["agent_name"] == "PlannerAgent" for run in runs_response.json())


def test_learning_path_detail_steps_and_plan_check() -> None:
    with TestClient(app) as client:
        student_id, course_id, _ = _create_profile(client)
        generated = client.post(
            "/api/learning-paths/generate",
            json={"student_id": student_id, "course_id": course_id, "target_days": 7},
        )
        path_id = generated.json()["path"]["id"]
        detail = client.get(f"/api/learning-paths/{path_id}")
        steps = client.get(f"/api/learning-paths/{path_id}/steps")
        plan_check = client.get(f"/api/learning-paths/{path_id}/plan-check")

    assert generated.status_code == 200
    assert detail.status_code == 200
    assert steps.status_code == 200
    assert plan_check.status_code == 200
    assert len(detail.json()["steps"]) >= 5
    assert len(steps.json()) >= 5
    check = plan_check.json()
    assert check["actual_step_count"] >= 5
    assert check["covered_weak_points"]
    assert check["recommended_resource_types"]


def test_learning_path_invalid_student_or_course_returns_404() -> None:
    with TestClient(app) as client:
        student_id, course_id, _ = _create_profile(client)
        missing_student = client.post(
            "/api/learning-paths/generate",
            json={"student_id": 999999, "course_id": course_id, "target_days": 7},
        )
        missing_course = client.post(
            "/api/learning-paths/generate",
            json={"student_id": student_id, "course_id": 999999, "target_days": 7},
        )

    assert missing_student.status_code == 404
    assert missing_course.status_code == 404


def test_learning_path_profile_mismatch_returns_400() -> None:
    suffix = uuid4().hex[:8]
    with TestClient(app) as client:
        student_id, course_id, profile_id = _create_profile(client)
        other_student = client.post(
            "/api/students",
            json={
                "name": f"画像不匹配学生-{suffix}",
                "major": "软件工程",
                "grade_level": "大二",
                "email": f"profile-mismatch-{suffix}@example.com",
            },
        )
        response = client.post(
            "/api/learning-paths/generate",
            json={
                "student_id": other_student.json()["id"],
                "course_id": course_id,
                "profile_id": profile_id,
                "target_days": 7,
            },
        )

    assert other_student.status_code == 201
    assert student_id != other_student.json()["id"]
    assert response.status_code == 400
