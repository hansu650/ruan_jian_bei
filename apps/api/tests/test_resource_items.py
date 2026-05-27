from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def get_seed_ids(client: TestClient) -> tuple[int, int]:
    students = client.get("/api/students").json()
    courses = client.get("/api/courses").json()
    student_id = next(student["id"] for student in students if student["name"] == "示例学生")
    course_id = next(course["id"] for course in courses if course["title"] == "数据库系统")
    return int(student_id), int(course_id)


def test_list_resource_items_contains_seed() -> None:
    with TestClient(app) as client:
        response = client.get("/api/resource-items")

    assert response.status_code == 200
    resources = response.json()
    assert any(resource["title"] == "B+ 树思维导图" for resource in resources)


def test_create_resource_item() -> None:
    suffix = uuid4().hex[:8]

    with TestClient(app) as client:
        student_id, course_id = get_seed_ids(client)
        response = client.post(
            "/api/resource-items",
            json={
                "course_id": course_id,
                "student_id": student_id,
                "resource_type": "reading",
                "title": f"测试资源-{suffix}",
                "status": "planned",
                "content_preview": "测试资源占位。",
            },
        )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == f"测试资源-{suffix}"


def test_create_resource_item_missing_course_returns_404() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/resource-items",
            json={
                "course_id": 999999,
                "resource_type": "reading",
                "title": "不存在课程",
            },
        )

    assert response.status_code == 404
