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
    assert "多智能体编排" in data["planned_features"]
