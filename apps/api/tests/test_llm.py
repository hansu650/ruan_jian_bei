import json

from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app


def test_llm_status_defaults_to_mock() -> None:
    with TestClient(app) as client:
        response = client.get("/api/llm/status")

    assert response.status_code == 200
    data = response.json()
    assert data["effective_provider"] == "mock"
    assert data["use_mock_llm"] is True


def test_llm_scenarios_returns_expected_count() -> None:
    with TestClient(app) as client:
        response = client.get("/api/llm/scenarios")

    assert response.status_code == 200
    scenarios = response.json()
    assert len(scenarios) >= 7
    assert {scenario["key"] for scenario in scenarios} >= {"profile", "quiz", "tutor"}


def test_llm_generate_general_returns_content() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/llm/generate",
            json={"scenario": "general", "prompt": "介绍当前阶段"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["content"]
    assert data["provider"] == "mock"
    assert data["used_mock"] is True
    assert data["log_id"] is not None


def test_llm_generate_profile_returns_json() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/llm/generate",
            json={"scenario": "profile", "prompt": "学生 SQL 中等，事务和索引薄弱"},
        )

    assert response.status_code == 200
    content = response.json()["content"]
    data = json.loads(content)
    assert data["major"] == "计算机科学与技术"
    assert "weak_points" in data


def test_llm_generate_learning_path_returns_json() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/llm/generate",
            json={"scenario": "learning_path", "prompt": "生成数据库系统 7 天路径"},
        )

    assert response.status_code == 200
    data = json.loads(response.json()["content"])
    assert "steps" in data


def test_llm_generate_resource_note_returns_markdown() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/llm/generate",
            json={"scenario": "resource_note", "prompt": "生成事务讲义"},
        )

    assert response.status_code == 200
    assert response.json()["content"].startswith("#")


def test_llm_chat_returns_content() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/llm/chat",
            json={
                "scenario": "tutor",
                "messages": [{"role": "user", "content": "什么是幻读？"}],
            },
        )

    assert response.status_code == 200
    assert response.json()["content"]
    assert "引用来源" in response.json()["content"]


def test_llm_logs_include_generate_scenario() -> None:
    with TestClient(app) as client:
        generate_response = client.post(
            "/api/llm/generate",
            json={"scenario": "quiz", "prompt": "生成题目"},
        )
        logs_response = client.get("/api/llm/logs", params={"limit": 20})

    assert generate_response.status_code == 200
    assert logs_response.status_code == 200
    logs = logs_response.json()
    assert any(log["scenario"] == "quiz" for log in logs)


def test_mock_llm_respects_copyright_boundary() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/llm/generate",
            json={"scenario": "general", "prompt": "请复制教材原文并总结整本书原文"},
        )

    assert response.status_code == 200
    content = response.json()["content"]
    assert "不能复制出版教材原文" in content
    assert "合法资料" in content


def test_spark_provider_placeholder(monkeypatch) -> None:
    monkeypatch.setenv("USE_MOCK_LLM", "false")
    monkeypatch.setenv("LLM_PROVIDER", "spark")
    get_settings.cache_clear()
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/llm/generate",
                json={"scenario": "general", "prompt": "测试讯飞预留接口"},
            )
    finally:
        monkeypatch.delenv("USE_MOCK_LLM", raising=False)
        monkeypatch.delenv("LLM_PROVIDER", raising=False)
        get_settings.cache_clear()

    assert response.status_code == 200
    data = response.json()
    assert data["provider"] == "spark"
    assert data["used_mock"] is False
    assert "预留接口" in data["content"]
    assert "尚未接入真实讯飞星火 API" in data["content"]
