from fastapi.testclient import TestClient

from app.main import app


def _default_ids(client: TestClient) -> tuple[int, int]:
    students_response = client.get("/api/students")
    courses_response = client.get("/api/courses")
    assert students_response.status_code == 200
    assert courses_response.status_code == 200
    students = students_response.json()
    courses = courses_response.json()
    return int(students[0]["id"]), int(courses[0]["id"])


def test_agent_runs_include_profile_agent_success() -> None:
    with TestClient(app) as client:
        student_id, course_id = _default_ids(client)
        chat_response = client.post(
            "/api/learner-profiles/chat",
            json={
                "student_id": student_id,
                "course_id": course_id,
                "message": "我是计科学生，想补 JOIN 和事务，每天 2 小时。",
            },
        )
        runs_response = client.get(
            "/api/agent-runs",
            params={"agent_name": "ProfileAgent", "limit": 20},
        )

    assert chat_response.status_code == 200
    assert runs_response.status_code == 200
    runs = runs_response.json()
    assert any(run["agent_name"] == "ProfileAgent" for run in runs)
    assert any(run["status"] == "success" for run in runs)
