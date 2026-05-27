from fastapi.testclient import TestClient

from app.main import app


def _default_course_id(client: TestClient) -> int:
    response = client.get("/api/courses")
    assert response.status_code == 200
    courses = response.json()
    database_course = next(course for course in courses if course["title"] == "数据库系统")
    return int(database_course["id"])


def _import_sample(client: TestClient, course_id: int) -> None:
    response = client.post(f"/api/courses/{course_id}/documents/import-sample")
    assert response.status_code == 200


def test_knowledge_base_stats_after_import() -> None:
    with TestClient(app) as client:
        course_id = _default_course_id(client)
        _import_sample(client, course_id)
        response = client.get(f"/api/courses/{course_id}/knowledge-base/stats")

    assert response.status_code == 200
    data = response.json()
    assert data["document_count"] >= 10
    assert data["chunk_count"] > 10
    assert data["indexed_document_count"] >= 10


def test_search_transaction_keyword_returns_source() -> None:
    with TestClient(app) as client:
        course_id = _default_course_id(client)
        _import_sample(client, course_id)
        response = client.get(
            f"/api/courses/{course_id}/knowledge-base/search",
            params={"q": "幻读", "limit": 10},
        )

    assert response.status_code == 200
    results = response.json()
    assert len(results) > 0
    assert any(
        "07_transaction.md" in item["filename"] or "幻读" in item["content"] for item in results
    )


def test_search_btree_keyword_returns_result() -> None:
    with TestClient(app) as client:
        course_id = _default_course_id(client)
        _import_sample(client, course_id)
        response = client.get(
            f"/api/courses/{course_id}/knowledge-base/search",
            params={"q": "B+树", "limit": 10},
        )

    assert response.status_code == 200
    assert len(response.json()) > 0


def test_search_join_keyword_returns_result() -> None:
    with TestClient(app) as client:
        course_id = _default_course_id(client)
        _import_sample(client, course_id)
        response = client.get(
            f"/api/courses/{course_id}/knowledge-base/search",
            params={"q": "JOIN", "limit": 10},
        )

    assert response.status_code == 200
    assert len(response.json()) > 0


def test_empty_search_returns_empty_list() -> None:
    with TestClient(app) as client:
        course_id = _default_course_id(client)
        response = client.get(
            f"/api/courses/{course_id}/knowledge-base/search",
            params={"q": ""},
        )

    assert response.status_code == 200
    assert response.json() == []


def test_knowledge_base_course_not_found_returns_404() -> None:
    with TestClient(app) as client:
        response = client.get("/api/courses/999999/knowledge-base/stats")

    assert response.status_code == 404
