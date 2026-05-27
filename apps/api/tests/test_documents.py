from fastapi.testclient import TestClient

from app.main import app


def _default_course_id(client: TestClient) -> int:
    response = client.get("/api/courses")
    assert response.status_code == 200
    courses = response.json()
    database_course = next(course for course in courses if course["title"] == "数据库系统")
    return int(database_course["id"])


def test_list_documents_initially_returns_200() -> None:
    with TestClient(app) as client:
        course_id = _default_course_id(client)
        response = client.get(f"/api/courses/{course_id}/documents")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_import_sample_documents_is_repeatable() -> None:
    with TestClient(app) as client:
        course_id = _default_course_id(client)
        first_response = client.post(f"/api/courses/{course_id}/documents/import-sample")
        second_response = client.post(f"/api/courses/{course_id}/documents/import-sample")
        documents_response = client.get(f"/api/courses/{course_id}/documents")
        stats_response = client.get(f"/api/courses/{course_id}/knowledge-base/stats")

    assert first_response.status_code == 200
    assert second_response.status_code == 200
    assert documents_response.status_code == 200
    assert stats_response.status_code == 200

    documents = documents_response.json()
    stats = stats_response.json()
    second_result = second_response.json()
    assert len(documents) >= 10
    assert stats["chunk_count"] > 10
    assert second_result["skipped_documents"] >= 10
    assert second_result["created_chunks"] == 0


def test_get_document_chunks_returns_chunks() -> None:
    with TestClient(app) as client:
        course_id = _default_course_id(client)
        client.post(f"/api/courses/{course_id}/documents/import-sample")
        documents_response = client.get(f"/api/courses/{course_id}/documents")
        document_id = documents_response.json()[0]["id"]
        response = client.get(f"/api/courses/{course_id}/documents/{document_id}/chunks")

    assert response.status_code == 200
    chunks = response.json()
    assert len(chunks) > 0
    assert "content" in chunks[0]


def test_upload_markdown_document_success() -> None:
    content = "# 自定义资料\n\n这一段用于测试 Markdown 上传、解析、分块和入库。"
    with TestClient(app) as client:
        course_id = _default_course_id(client)
        response = client.post(
            f"/api/courses/{course_id}/documents/upload",
            files={"file": ("phase4_upload.md", content, "text/markdown")},
        )

    assert response.status_code == 201
    data = response.json()
    assert data["source_type"] == "upload"
    assert data["status"] == "indexed"
    assert data["chunk_count"] >= 1


def test_upload_unsupported_file_type_returns_400() -> None:
    with TestClient(app) as client:
        course_id = _default_course_id(client)
        response = client.post(
            f"/api/courses/{course_id}/documents/upload",
            files={"file": ("bad.pdf", b"not a real pdf", "application/pdf")},
        )

    assert response.status_code == 400


def test_documents_course_not_found_returns_404() -> None:
    with TestClient(app) as client:
        response = client.get("/api/courses/999999/documents")

    assert response.status_code == 404
