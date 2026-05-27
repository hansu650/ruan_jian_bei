from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def get_seed_course_id(client: TestClient) -> int:
    courses = client.get("/api/courses").json()
    for course in courses:
        if course["title"] == "数据库系统":
            return int(course["id"])
    raise AssertionError("Seed course not found")


def test_list_seed_knowledge_points() -> None:
    with TestClient(app) as client:
        course_id = get_seed_course_id(client)
        response = client.get(f"/api/courses/{course_id}/knowledge-points")

    assert response.status_code == 200
    points = response.json()
    assert len(points) >= 10
    assert any(point["title"] == "SQL 基础" for point in points)


def test_create_knowledge_point() -> None:
    suffix = uuid4().hex[:8]
    payload = {
        "title": f"测试知识点-{suffix}",
        "chapter": "测试章节",
        "order_index": 99,
        "summary": "测试创建知识点。",
        "difficulty": "medium",
    }

    with TestClient(app) as client:
        course_id = get_seed_course_id(client)
        response = client.post(f"/api/courses/{course_id}/knowledge-points", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["course_id"] == course_id


def test_missing_course_knowledge_points_returns_404() -> None:
    with TestClient(app) as client:
        response = client.get("/api/courses/999999/knowledge-points")

    assert response.status_code == 404
