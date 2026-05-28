import json

from fastapi.testclient import TestClient

from app.main import app

PROFILE_SAMPLE = (
    "我是大二计科学生，数据库要期末考试了。SQL 基础还行，但是 JOIN、事务隔离级别、"
    "索引和 B+ 树不太会。每天能学 2 小时，希望 7 天过一遍重点。"
    "我喜欢例题和图解，也希望有实操案例。"
)

RESOURCE_TYPES = [
    "lecture_note",
    "mindmap",
    "quiz",
    "reading",
    "practice_case",
    "video_script",
]


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


def _prepare_step(client: TestClient) -> tuple[int, int, int]:
    student_id = _default_student_id(client)
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
    return student_id, course_id, int(steps[0]["id"])


def test_resource_types_include_required_six() -> None:
    with TestClient(app) as client:
        response = client.get("/api/generated-resources/types")

    assert response.status_code == 200
    keys = {item["key"] for item in response.json()}
    assert set(RESOURCE_TYPES).issubset(keys)


def test_generate_all_resource_types_for_step() -> None:
    with TestClient(app) as client:
        student_id, course_id, step_id = _prepare_step(client)
        response = client.post(
            "/api/generated-resources/generate-for-step",
            json={
                "student_id": student_id,
                "course_id": course_id,
                "step_id": step_id,
                "resource_types": RESOURCE_TYPES,
            },
        )
        runs_response = client.get("/api/agent-runs", params={"agent_name": "ResourceAgent"})

    assert response.status_code == 200
    data = response.json()
    assert len(data["resources"]) == 6
    by_type = {item["resource_type"]: item for item in data["resources"]}
    assert set(RESOURCE_TYPES) == set(by_type)
    assert by_type["lecture_note"]["content"].startswith("#")
    assert "```mermaid" in by_type["mindmap"]["content"]
    assert "练习题" in by_type["quiz"]["content"]
    assert "拓展阅读" in by_type["reading"]["content"]
    assert "```sql" in by_type["practice_case"]["content"]
    assert "分镜脚本" in by_type["video_script"]["content"]
    for resource in data["resources"]:
        citations = json.loads(resource["citations_json"])
        assert isinstance(citations, list)
        assert citations
        assert "chunk_id" in citations[0]
    assert data["agent_run_ids"]
    assert data["llm_log_ids"]
    assert runs_response.status_code == 200
    assert any(run["agent_name"] == "ResourceAgent" for run in runs_response.json())


def test_generate_single_resource_and_query_detail() -> None:
    with TestClient(app) as client:
        student_id, course_id, step_id = _prepare_step(client)
        generated = client.post(
            "/api/generated-resources/generate",
            json={
                "student_id": student_id,
                "course_id": course_id,
                "step_id": step_id,
                "resource_type": "practice_case",
            },
        )
        resource_id = generated.json()["resource"]["id"]
        detail = client.get(f"/api/generated-resources/{resource_id}")
        listing = client.get(
            "/api/generated-resources",
            params={"student_id": student_id, "course_id": course_id, "step_id": step_id},
        )

    assert generated.status_code == 200
    assert generated.json()["citation_count"] > 0
    assert detail.status_code == 200
    assert detail.json()["resource_type"] == "practice_case"
    assert listing.status_code == 200
    assert any(item["id"] == resource_id for item in listing.json())


def test_generated_resource_invalid_inputs() -> None:
    with TestClient(app) as client:
        student_id, course_id, step_id = _prepare_step(client)
        bad_type = client.post(
            "/api/generated-resources/generate",
            json={
                "student_id": student_id,
                "course_id": course_id,
                "step_id": step_id,
                "resource_type": "unknown",
            },
        )
        missing_step = client.post(
            "/api/generated-resources/generate",
            json={
                "student_id": student_id,
                "course_id": course_id,
                "step_id": 999999,
                "resource_type": "lecture_note",
            },
        )
        missing_student = client.post(
            "/api/generated-resources/generate",
            json={
                "student_id": 999999,
                "course_id": course_id,
                "step_id": step_id,
                "resource_type": "lecture_note",
            },
        )

    assert bad_type.status_code == 400
    assert missing_step.status_code == 404
    assert missing_student.status_code == 404
