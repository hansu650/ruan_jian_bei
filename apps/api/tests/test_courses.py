from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def test_list_courses_contains_seed_course() -> None:
    with TestClient(app) as client:
        response = client.get("/api/courses")

    assert response.status_code == 200
    courses = response.json()
    assert any(course["title"] == "数据库系统" for course in courses)


def test_create_course() -> None:
    suffix = uuid4().hex[:8]
    payload = {
        "title": f"操作系统-{suffix}",
        "description": "测试用课程。",
        "subject": "计算机科学",
        "semester": "2026 秋季",
    }

    with TestClient(app) as client:
        response = client.post("/api/courses", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["id"] > 0


def test_get_missing_course_returns_404() -> None:
    with TestClient(app) as client:
        response = client.get("/api/courses/999999")

    assert response.status_code == 404
