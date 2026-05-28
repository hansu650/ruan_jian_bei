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
    assert "PlannerAgent" in data["implemented_features"]
    assert "ResourceAgent" in data["implemented_features"]
    assert "TutorAgent 智能辅导" in data["implemented_features"]
    assert "CitationVerifier 轻量防幻觉校验" in data["implemented_features"]
    assert "辅导回答 citations_json" in data["implemented_features"]
    assert "完整多智能体编排" in data["planned_features"]
    assert "PracticeAgent 练习交互" in data["planned_features"]
    assert "EvaluatorAgent 自动批改" in data["planned_features"]
    assert "真实讯飞星火接入" in data["planned_features"]
