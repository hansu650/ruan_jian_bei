from fastapi.testclient import TestClient

from app.main import app


def test_project_meta() -> None:
    client = TestClient(app)

    response = client.get("/api/meta")

    assert response.status_code == 200
    data = response.json()
    assert data["competition_track"] == "A3"
    assert "多智能体编排" in data["planned_features"]
