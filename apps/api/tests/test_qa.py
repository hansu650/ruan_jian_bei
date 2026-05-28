from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.config import get_settings
from app.db.database import engine
from app.db.models import (
    Course,
    DocumentChunk,
    GeneratedResource,
    LearnerProfile,
    LearningEvaluationReport,
    LearningPath,
    LLMCallLog,
    PracticeAttempt,
    PracticeQuiz,
    Student,
    TutorMessage,
    TutorSession,
)
from app.main import app


def _count(model: type[Any]) -> int:
    with Session(engine) as session:
        return len(session.exec(select(model)).all())


def _snapshot_counts() -> dict[str, int]:
    return {
        "students": _count(Student),
        "courses": _count(Course),
        "chunks": _count(DocumentChunk),
        "profiles": _count(LearnerProfile),
        "paths": _count(LearningPath),
        "resources": _count(GeneratedResource),
        "tutor_sessions": _count(TutorSession),
        "tutor_messages": _count(TutorMessage),
        "quizzes": _count(PracticeQuiz),
        "attempts": _count(PracticeAttempt),
        "reports": _count(LearningEvaluationReport),
        "llm_logs": _count(LLMCallLog),
    }


def test_qa_checklist_returns_manual_items() -> None:
    with TestClient(app) as client:
        response = client.get("/api/qa/checklist")

    assert response.status_code == 200
    data = response.json()
    items = data["items"]
    modules = {item["module"] for item in items}
    routes = {item["route"] for item in items}
    assert len(modules) >= 8
    assert len(items) >= 12
    expected_routes = {
        "/profile",
        "/learning-path",
        "/resources",
        "/tutor",
        "/practice",
        "/analytics",
    }
    assert expected_routes <= routes
    assert any(item["may_call_spark"] for item in items)
    assert "password" not in response.text.lower()


def test_qa_smoke_status_reads_state_without_mutating_or_logging() -> None:
    before = _snapshot_counts()
    with TestClient(app) as client:
        response = client.get("/api/qa/smoke-status")
    after = _snapshot_counts()

    assert response.status_code == 200
    data = response.json()
    assert data["items"]
    assert any(item["key"] == "llm_mode" for item in data["items"])
    assert after == before
    assert "password" not in response.text.lower()


def test_qa_smoke_status_with_spark_http_env_does_not_leak_key_or_call_network(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake_password = "phase12-fake-secret"
    monkeypatch.setenv("USE_MOCK_LLM", "false")
    monkeypatch.setenv("LLM_PROVIDER", "spark-http")
    monkeypatch.setenv("SPARK_HTTP_API_PASSWORD", fake_password)
    monkeypatch.setenv("SPARK_MODEL", "lite")
    get_settings.cache_clear()
    before_logs = _count(LLMCallLog)
    try:
        with TestClient(app) as client:
            response = client.get("/api/qa/smoke-status")
    finally:
        get_settings.cache_clear()
    after_logs = _count(LLMCallLog)

    assert response.status_code == 200
    assert fake_password not in response.text
    assert after_logs == before_logs
    llm_item = next(item for item in response.json()["items"] if item["key"] == "llm_mode")
    assert llm_item["status"] == "ok"
