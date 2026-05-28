from collections.abc import Generator

import pytest

from app.core.config import get_settings


@pytest.fixture(autouse=True)
def force_mock_llm_for_tests(monkeypatch: pytest.MonkeyPatch) -> Generator[None, None, None]:
    monkeypatch.setenv("USE_MOCK_LLM", "true")
    monkeypatch.setenv("LLM_PROVIDER", "mock")
    monkeypatch.delenv("SPARK_HTTP_API_PASSWORD", raising=False)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
