from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings, get_settings
from app.llm.factory import get_llm_provider
from app.llm.mock_provider import MockLLMProvider
from app.llm.spark_http_provider import SparkHTTPProvider
from app.main import app
from app.services.llm_service import _normalize_json_content

FAKE_PASSWORD = "fake-spark-password-for-tests"


class FakeSparkResponse:
    def __init__(self, status_code: int, payload: dict[str, Any]) -> None:
        self.status_code = status_code
        self._payload = payload

    def json(self) -> dict[str, Any]:
        return self._payload


def test_factory_defaults_to_mock_when_use_mock_llm_is_true() -> None:
    provider = get_llm_provider(
        Settings(
            use_mock_llm=True,
            llm_provider="spark-http",
            spark_http_api_password=FAKE_PASSWORD,
        )
    )

    assert isinstance(provider, MockLLMProvider)
    assert provider.provider_name == "mock"


def test_factory_falls_back_to_mock_without_spark_http_password() -> None:
    provider = get_llm_provider(
        Settings(
            use_mock_llm=False,
            llm_provider="spark-http",
            spark_http_api_password="",
        )
    )

    assert isinstance(provider, MockLLMProvider)
    assert provider.provider_name == "mock"
    assert provider.status()["warning"] == "SPARK_HTTP_API_PASSWORD 未配置，已回退 MockLLMProvider"


def test_spark_http_provider_chat_parses_content(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict[str, Any] = {}

    def fake_post(
        url: str,
        *,
        headers: dict[str, str],
        json: dict[str, Any],
        timeout: int,
    ) -> FakeSparkResponse:
        captured.update({"url": url, "headers": headers, "json": json, "timeout": timeout})
        return FakeSparkResponse(
            200,
            {"choices": [{"message": {"content": "讯飞星火模拟返回"}}]},
        )

    monkeypatch.setattr("app.llm.spark_http_provider.httpx.post", fake_post)
    provider = SparkHTTPProvider(
        model_name="lite",
        api_url="https://spark-api-open.xf-yun.com/v1/chat/completions",
        api_password=FAKE_PASSWORD,
        timeout_seconds=9,
    )

    content = provider.chat(
        messages=[{"role": "user", "content": "你好"}],
        temperature=0.2,
        response_format="json_object",
    )

    assert content == "讯飞星火模拟返回"
    assert captured["url"] == "https://spark-api-open.xf-yun.com/v1/chat/completions"
    assert captured["headers"]["Authorization"] == f"Bearer {FAKE_PASSWORD}"
    assert captured["json"]["model"] == "lite"
    assert captured["json"]["stream"] is False
    assert captured["json"]["response_format"] == {"type": "json_object"}
    assert captured["timeout"] == 9


def test_spark_http_provider_non_json_scenario_omits_response_format(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured: dict[str, Any] = {}

    def fake_post(
        url: str,
        *,
        headers: dict[str, str],
        json: dict[str, Any],
        timeout: int,
    ) -> FakeSparkResponse:
        del url, headers, timeout
        captured.update(json)
        return FakeSparkResponse(200, {"choices": [{"message": {"content": "ok"}}]})

    monkeypatch.setattr("app.llm.spark_http_provider.httpx.post", fake_post)
    provider = SparkHTTPProvider(
        model_name="lite",
        api_url="https://spark-api-open.xf-yun.com/v1/chat/completions",
        api_password=FAKE_PASSWORD,
    )

    assert provider.chat([{"role": "user", "content": "hello"}]) == "ok"
    assert "response_format" not in captured


def test_json_scenario_normalizes_markdown_fenced_json() -> None:
    content = "```json\n{\"major\":\"计算机科学与技术\",\"weak_points\":[\"JOIN\"]}\n```"

    normalized = _normalize_json_content("profile", content)

    assert normalized.startswith("{")
    assert "```" not in normalized
    assert normalized == '{\n  "major": "计算机科学与技术",\n  "weak_points": [\n    "JOIN"\n  ]\n}'


def test_spark_http_provider_http_error_hides_password(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def fake_post(
        url: str,
        *,
        headers: dict[str, str],
        json: dict[str, Any],
        timeout: int,
    ) -> FakeSparkResponse:
        del url, headers, json, timeout
        return FakeSparkResponse(401, {"message": "unauthorized"})

    monkeypatch.setattr("app.llm.spark_http_provider.httpx.post", fake_post)
    provider = SparkHTTPProvider(
        model_name="lite",
        api_url="https://spark-api-open.xf-yun.com/v1/chat/completions",
        api_password=FAKE_PASSWORD,
    )

    with pytest.raises(RuntimeError) as exc_info:
        provider.chat([{"role": "user", "content": "hello"}])

    message = str(exc_info.value)
    assert "401" in message
    assert FAKE_PASSWORD not in message


def test_llm_status_does_not_return_spark_http_password(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("USE_MOCK_LLM", "false")
    monkeypatch.setenv("LLM_PROVIDER", "spark-http")
    monkeypatch.setenv("SPARK_HTTP_API_PASSWORD", FAKE_PASSWORD)
    monkeypatch.setenv("SPARK_MODEL", "lite")
    get_settings.cache_clear()
    try:
        with TestClient(app) as client:
            response = client.get("/api/llm/status")
    finally:
        get_settings.cache_clear()

    assert response.status_code == 200
    response_text = response.text
    data = response.json()
    assert data["effective_provider"] == "spark-http"
    assert data["spark_http_configured"] is True
    assert FAKE_PASSWORD not in response_text


def test_llm_status_missing_spark_http_password_returns_warning(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("USE_MOCK_LLM", "false")
    monkeypatch.setenv("LLM_PROVIDER", "spark-http")
    monkeypatch.delenv("SPARK_HTTP_API_PASSWORD", raising=False)
    get_settings.cache_clear()
    try:
        with TestClient(app) as client:
            response = client.get("/api/llm/status")
    finally:
        get_settings.cache_clear()

    assert response.status_code == 200
    data = response.json()
    assert data["effective_provider"] == "mock"
    assert data["spark_http_configured"] is False
    assert data["warning"] == "SPARK_HTTP_API_PASSWORD 未配置，已回退 MockLLMProvider"
