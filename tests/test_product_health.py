"""Product-level test: health endpoint.

Ensures the deployed API contract (GET /health) works so CI "Tests Passing"
reflects the actual product.
"""

import pytest
from fastapi.testclient import TestClient

from src.main import app


@pytest.fixture
def client():
    """TestClient for the main app (conftest sets TESTING=true so no DB init)."""
    return TestClient(app)


def test_health_returns_200_and_healthy(client: TestClient):
    """GET /health returns 200 and status 'healthy' with version."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert isinstance(data["version"], str)
    assert len(data["version"]) > 0


def test_predict_returns_prediction_and_confidence(client: TestClient):
    """POST /predict matches bleujs.org gateway contract (10 floats → JSON)."""
    payload = {"features": [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]}
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert "confidence" in data
    assert isinstance(data["prediction"], int)
    assert isinstance(data["confidence"], (int, float))
    assert 0.0 <= float(data["confidence"]) <= 1.0


def test_predict_rejects_wrong_feature_count(client: TestClient):
    """POST /predict requires exactly 10 features."""
    response = client.post("/predict", json={"features": [1.0] * 9})
    assert response.status_code == 422
