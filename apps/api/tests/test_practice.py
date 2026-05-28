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
            "name": f"练习测验学生-{suffix}",
            "major": "计算机科学与技术",
            "grade_level": "大二",
            "email": f"practice-{suffix}@example.com",
        },
    )
    assert response.status_code == 201
    return int(response.json()["id"])


def _prepare_step(client: TestClient) -> tuple[int, int, int, int]:
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
    steps = path_response.json()["steps"]
    assert steps
    return student_id, course_id, int(steps[0]["id"]), int(profile_response.json()["profile"]["id"])


def test_question_types_include_required_four() -> None:
    with TestClient(app) as client:
        response = client.get("/api/practice/question-types")

    assert response.status_code == 200
    keys = {item["key"] for item in response.json()}
    assert {"single_choice", "multiple_choice", "short_answer", "sql_practice"}.issubset(keys)


def test_generate_quiz_without_profile_returns_400() -> None:
    with TestClient(app) as client:
        student_id = _create_student(client)
        course_id = _default_course_id(client)
        path_response = client.post(
            "/api/learning-paths/generate",
            json={"student_id": student_id, "course_id": course_id, "target_days": 7},
        )

    assert path_response.status_code == 400


def test_generate_quiz_for_learning_path_step() -> None:
    with TestClient(app) as client:
        student_id, course_id, step_id, _ = _prepare_step(client)
        response = client.post(
            "/api/practice/quizzes/generate",
            json={
                "student_id": student_id,
                "course_id": course_id,
                "step_id": step_id,
                "difficulty": "medium",
                "question_count": 6,
            },
        )
        listing = client.get(
            "/api/practice/quizzes",
            params={"student_id": student_id, "course_id": course_id, "step_id": step_id},
        )
        runs = client.get("/api/agent-runs", params={"agent_name": "PracticeAgent"})

    assert response.status_code == 200
    data = response.json()
    assert data["quiz"]["id"] > 0
    assert len(data["questions"]) >= 4
    question_types = {item["question_type"] for item in data["questions"]}
    assert len(question_types) >= 3
    assert "correct_answer_json" not in data["questions"][0]
    assert listing.status_code == 200
    assert any(item["id"] == data["quiz"]["id"] for item in listing.json())
    assert runs.status_code == 200
    assert any(run["agent_name"] == "PracticeAgent" for run in runs.json())


def test_quiz_detail_hides_correct_answer() -> None:
    with TestClient(app) as client:
        student_id, course_id, step_id, _ = _prepare_step(client)
        generated = client.post(
            "/api/practice/quizzes/generate",
            json={"student_id": student_id, "course_id": course_id, "step_id": step_id},
        )
        quiz_id = generated.json()["quiz"]["id"]
        detail = client.get(f"/api/practice/quizzes/{quiz_id}")

    assert generated.status_code == 200
    assert detail.status_code == 200
    assert detail.json()["questions"]
    assert "correct_answer_json" not in detail.json()["questions"][0]


def test_practice_invalid_inputs() -> None:
    with TestClient(app) as client:
        student_id, course_id, step_id, _ = _prepare_step(client)
        missing_student = client.post(
            "/api/practice/quizzes/generate",
            json={"student_id": 999999, "course_id": course_id, "step_id": step_id},
        )
        missing_step = client.post(
            "/api/practice/quizzes/generate",
            json={"student_id": student_id, "course_id": course_id, "step_id": 999999},
        )
        bad_type = client.post(
            "/api/practice/quizzes/generate",
            json={
                "student_id": student_id,
                "course_id": course_id,
                "step_id": step_id,
                "question_types": ["unknown"],
            },
        )

    assert missing_student.status_code == 404
    assert missing_step.status_code == 404
    assert bad_type.status_code == 400
