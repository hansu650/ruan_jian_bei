from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def get_seed_ids(client: TestClient) -> tuple[int, int]:
    students = client.get("/api/students").json()
    courses = client.get("/api/courses").json()
    student_id = next(student["id"] for student in students if student["name"] == "示例学生")
    course_id = next(course["id"] for course in courses if course["title"] == "数据库系统")
    return int(student_id), int(course_id)


def test_list_profile_drafts_contains_seed() -> None:
    with TestClient(app) as client:
        response = client.get("/api/profile-drafts")

    assert response.status_code == 200
    drafts = response.json()
    assert any(draft["goal"] == "7 天掌握数据库系统期末重点" for draft in drafts)


def test_create_profile_draft() -> None:
    suffix = uuid4().hex[:8]

    with TestClient(app) as client:
        student_id, course_id = get_seed_ids(client)
        response = client.post(
            "/api/profile-drafts",
            json={
                "student_id": student_id,
                "course_id": course_id,
                "goal": f"测试目标-{suffix}",
                "background": "测试背景。",
                "weak_points_json": '["事务"]',
                "preferences_json": '["图解"]',
                "mastery_json": '{"事务":40}',
                "notes": "测试画像草稿。",
            },
        )

    assert response.status_code == 201
    data = response.json()
    assert data["goal"] == f"测试目标-{suffix}"


def test_create_profile_draft_missing_student_returns_404() -> None:
    with TestClient(app) as client:
        _, course_id = get_seed_ids(client)
        response = client.post(
            "/api/profile-drafts",
            json={
                "student_id": 999999,
                "course_id": course_id,
                "goal": "不存在学生",
                "background": "测试背景。",
            },
        )

    assert response.status_code == 404
