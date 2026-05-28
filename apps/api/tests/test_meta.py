from fastapi.testclient import TestClient

from app.main import app


def test_project_meta() -> None:
    with TestClient(app) as client:
        response = client.get("/api/meta")

    assert response.status_code == 200
    data = response.json()
    assert data["competition_track"] == "A3"
    assert "基础 CRUD API" in data["implemented_features"]
    assert "基础关键词检索" in data["implemented_features"]
    assert "MockLLMProvider" in data["implemented_features"]
    assert "ProfileAgent" in data["implemented_features"]
    assert "8 维学习画像" in data["implemented_features"]
    assert "PlannerAgent" in data["implemented_features"]
    assert "薄弱点覆盖检查" in data["implemented_features"]
    assert "ResourceAgent" in data["implemented_features"]
    assert "GeneratedResource" in data["implemented_features"]
    assert "引用来源 citations" in data["implemented_features"]
    assert "完整多智能体编排" in data["planned_features"]
    assert "真实讯飞星火接入" in data["planned_features"]
