import logging

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

from src.python.backend.middleware.error_handling import setup_error_handling


@pytest.fixture
def app():
    app = FastAPI()
    setup_error_handling(app)

    @app.get("/error")
    async def raise_error():
        raise HTTPException(status_code=400, detail="Test error")

    @app.get("/validation-error")
    async def raise_validation_error():
        raise ValueError("Validation error")

    @app.get("/server-error")
    async def raise_server_error():
        raise RuntimeError("Server error")

    return app


@pytest.fixture
def client(app):
    return TestClient(app)


def test_http_exception_handling(client):
    """Test handling of HTTP exceptions."""
    response = client.get("/error")

    assert response.status_code == 400
    assert response.json() == {"detail": "Test error", "status_code": 400}


def test_validation_error_handling(client):
    """Test handling of validation errors."""
    response = client.get("/validation-error")

    assert response.status_code == 422
    assert "Validation error" in response.json()["detail"]


def test_server_error_handling(client):
    """Test handling of server errors."""
    response = client.get("/server-error")

    assert response.status_code == 500
    assert "Server error" in response.json()["detail"]


def test_error_logging(client, caplog):
    """Test error logging."""
    with caplog.at_level(logging.ERROR):
        client.get("/error")

    assert "Test error" in caplog.text
    assert "HTTPException" in caplog.text


def test_error_response_format(client):
    """Test error response format."""
    response = client.get("/error")

    assert "detail" in response.json()
    assert "status_code" in response.json()
    assert "timestamp" in response.json()
    assert "path" in response.json()


def test_custom_error_handling(app, client):
    """Test custom error handling."""

    @app.exception_handler(ValueError)
    async def custom_value_error_handler(request, exc):
        return JSONResponse(
            status_code=400, content={"message": str(exc), "custom": True}
        )

    response = client.get("/validation-error")

    assert response.status_code == 400
    assert response.json()["message"] == "Validation error"
    assert response.json()["custom"] is True


def test_error_traceback_in_development(app, client, monkeypatch):
    """Test error traceback in development mode."""
    monkeypatch.setenv("ENVIRONMENT", "development")

    response = client.get("/server-error")

    assert response.status_code == 500
    assert "traceback" in response.json()


def test_error_traceback_not_in_production(app, client, monkeypatch):
    """Test error traceback not included in production mode."""
    monkeypatch.setenv("ENVIRONMENT", "production")

    response = client.get("/server-error")

    assert response.status_code == 500
    assert "traceback" not in response.json()
