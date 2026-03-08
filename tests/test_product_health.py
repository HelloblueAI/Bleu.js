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
