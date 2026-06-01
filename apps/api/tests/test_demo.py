from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, col, select

from app.core.config import get_settings
from app.db.database import engine
from app.db.models import (
    Course,
    CourseDocument,
    DocumentChunk,
    GeneratedResource,
    LearnerProfile,
    LearningPath,
    LLMCallLog,
    PracticeAttempt,
    PracticeQuiz,
    Student,
    TutorSession,
)
from app.main import app


def _default_ids() -> tuple[int, int]:
    with Session(engine) as session:
        student = session.exec(select(Student).where(Student.email == "demo@example.com")).first()
        course = session.exec(select(Course).order_by(col(Course.id))).first()
        assert student is not None
        assert course is not None
        assert student.id is not None
        assert course.id is not None
        return student.id, course.id


def _count_for_default(model: Any, student_id: int, course_id: int) -> int:
    with Session(engine) as session:
        statement = select(model)
        if hasattr(model, "student_id"):
            statement = statement.where(model.student_id == student_id)
        if hasattr(model, "course_id"):
            statement = statement.where(model.course_id == course_id)
        return len(session.exec(statement).all())


def test_demo_status_returns_steps_and_llm_mode() -> None:
    with TestClient(app) as client:
        response = client.get("/api/demo/status")

    assert response.status_code == 200
    data = response.json()
    assert len(data["steps"]) >= 8
    assert data["student_id"] is not None
    assert data["course_id"] is not None
    assert data["llm_mode"]["effective_provider"]
    assert "password" not in response.text.lower()


def test_demo_bootstrap_imports_documents_without_generating_ai_artifacts() -> None:
    with TestClient(app) as client:
        student_id, course_id = _default_ids()
        before_logs = _count_for_default(LLMCallLog, student_id, course_id)
        before_profiles = _count_for_default(LearnerProfile, student_id, course_id)
        before_paths = _count_for_default(LearningPath, student_id, course_id)
        before_resources = _count_for_default(GeneratedResource, student_id, course_id)
        before_tutor_sessions = _count_for_default(TutorSession, student_id, course_id)
        before_quizzes = _count_for_default(PracticeQuiz, student_id, course_id)
        before_attempts = _count_for_default(PracticeAttempt, student_id, course_id)

        response = client.post("/api/demo/bootstrap")
        status_response = client.get("/api/demo/status")

        after_logs = _count_for_default(LLMCallLog, student_id, course_id)
        after_profiles = _count_for_default(LearnerProfile, student_id, course_id)
        after_paths = _count_for_default(LearningPath, student_id, course_id)
        after_resources = _count_for_default(GeneratedResource, student_id, course_id)
        after_tutor_sessions = _count_for_default(TutorSession, student_id, course_id)
        after_quizzes = _count_for_default(PracticeQuiz, student_id, course_id)
        after_attempts = _count_for_default(PracticeAttempt, student_id, course_id)

    assert response.status_code == 200
    assert status_response.status_code == 200
    data = response.json()
    assert data["student_id"] == student_id
    assert data["course_id"] == course_id
    assert data["chunk_count"] > 0
    assert after_logs == before_logs
    assert after_profiles == before_profiles
    assert after_paths == before_paths
    assert after_resources == before_resources
    assert after_tutor_sessions == before_tutor_sessions
    assert after_quizzes == before_quizzes
    assert after_attempts == before_attempts
    knowledge_step = next(
        step for step in status_response.json()["steps"] if step["key"] == "knowledge_base"
    )
    assert knowledge_step["status"] == "ready"


def test_demo_bootstrap_is_repeatable() -> None:
    with TestClient(app) as client:
        first = client.post("/api/demo/bootstrap")
        _, course_id = _default_ids()
        with Session(engine) as session:
            document_count_before = len(
                session.exec(
                    select(CourseDocument).where(CourseDocument.course_id == course_id)
                ).all()
            )
            chunk_count_before = len(
                session.exec(
                    select(DocumentChunk).where(DocumentChunk.course_id == course_id)
                ).all()
            )
        second = client.post("/api/demo/bootstrap")
        with Session(engine) as session:
            document_count_after = len(
                session.exec(
                    select(CourseDocument).where(CourseDocument.course_id == course_id)
                ).all()
            )
            chunk_count_after = len(
                session.exec(
                    select(DocumentChunk).where(DocumentChunk.course_id == course_id)
                ).all()
            )

    assert first.status_code == 200
    assert second.status_code == 200
    assert document_count_after == document_count_before
    assert chunk_count_after == chunk_count_before


def test_demo_status_with_spark_http_env_does_not_leak_key_or_call_network(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake_password = "phase11-fake-password"
    monkeypatch.setenv("USE_MOCK_LLM", "false")
    monkeypatch.setenv("LLM_PROVIDER", "spark-http")
    monkeypatch.setenv("SPARK_HTTP_API_PASSWORD", fake_password)
    monkeypatch.setenv("SPARK_MODEL", "lite")
    get_settings.cache_clear()
    try:
        with TestClient(app) as client:
            response = client.get("/api/demo/status")
    finally:
        get_settings.cache_clear()

    assert response.status_code == 200
    assert response.json()["llm_mode"]["effective_provider"] == "spark-http"
    assert response.json()["llm_mode"]["spark_http_configured"] is True
    assert fake_password not in response.text


def test_demo_status_falls_back_to_mock_when_spark_http_password_missing(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("USE_MOCK_LLM", "false")
    monkeypatch.setenv("LLM_PROVIDER", "spark-http")
    monkeypatch.setenv("SPARK_HTTP_API_PASSWORD", "")
    get_settings.cache_clear()
    try:
        with TestClient(app) as client:
            response = client.get("/api/demo/status")
    finally:
        get_settings.cache_clear()

    assert response.status_code == 200
    mode = response.json()["llm_mode"]
    assert mode["effective_provider"] == "mock"
    assert mode["mode_level"] == "warning"
    assert "SPARK_HTTP_API_PASSWORD" not in response.text
