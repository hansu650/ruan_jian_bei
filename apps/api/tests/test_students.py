from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def test_list_students_contains_seed_student() -> None:
    with TestClient(app) as client:
        response = client.get("/api/students")

    assert response.status_code == 200
    students = response.json()
    assert any(student["name"] == "示例学生" for student in students)


def test_create_student() -> None:
    suffix = uuid4().hex[:8]
    payload = {
        "name": f"测试学生-{suffix}",
        "major": "软件工程",
        "grade_level": "大三",
        "email": f"student-{suffix}@example.com",
    }

    with TestClient(app) as client:
        response = client.post("/api/students", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["id"] > 0


def test_get_missing_student_returns_404() -> None:
    with TestClient(app) as client:
        response = client.get("/api/students/999999")

    assert response.status_code == 404
