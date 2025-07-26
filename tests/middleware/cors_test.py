import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.middleware.cors import setup_cors


@pytest.fixture
def app():
    app = FastAPI()
    setup_cors(app)
    return app


@pytest.fixture
def client(app):
    return TestClient(app)


def test_cors_headers_with_allowed_origin(client):
    """Test CORS headers with allowed origin."""
    origin = "http://localhost:3000"
    response = client.options(
        "/",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )

    # Check CORS headers
    assert response.headers["Access-Control-Allow-Origin"] == origin
    assert (
        response.headers["Access-Control-Allow-Methods"]
        == "GET, POST, PUT, DELETE, OPTIONS"
    )
    assert (
        response.headers["Access-Control-Allow-Headers"]
        == "Content-Type, Authorization"
    )
    assert response.headers["Access-Control-Allow-Credentials"] == "true"
    assert response.headers["Access-Control-Max-Age"] == "600"


def test_cors_headers_with_disallowed_origin(client):
    """Test CORS headers with disallowed origin."""
    origin = "http://malicious-site.com"
    response = client.options(
        "/", headers={"Origin": origin, "Access-Control-Request-Method": "GET"}
    )

    # Origin should not be in allowed origins
    assert "Access-Control-Allow-Origin" not in response.headers


def test_cors_preflight_request(client):
    """Test CORS preflight request handling."""
    origin = "http://localhost:3000"
    response = client.options(
        "/",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type, Authorization",
        },
    )

    assert response.status_code == 200
    assert response.headers["Access-Control-Allow-Origin"] == origin
    assert "POST" in response.headers["Access-Control-Allow-Methods"]
    assert "Content-Type" in response.headers["Access-Control-Allow-Headers"]
    assert "Authorization" in response.headers["Access-Control-Allow-Headers"]


def test_cors_actual_request(client):
    """Test CORS headers in actual request."""
    origin = "http://localhost:3000"
    response = client.get("/", headers={"Origin": origin})

    assert response.status_code == 200
    assert response.headers["Access-Control-Allow-Origin"] == origin
    assert response.headers["Access-Control-Allow-Credentials"] == "true"


def test_cors_configuration_from_env(client, monkeypatch):
    """Test CORS configuration from environment variables."""
    # Set test environment variables
    monkeypatch.setenv("CORS_ORIGINS", "http://test.com,https://test.com")
    monkeypatch.setenv("CORS_METHODS", "GET,POST")
    monkeypatch.setenv("CORS_HEADERS", "X-Custom-Header")

    # Create new app with environment-based configuration
    app = FastAPI()
    setup_cors(app)
    new_client = TestClient(app)

    # Test with allowed origin
    origin = "http://test.com"
    response = new_client.options(
        "/",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "X-Custom-Header",
        },
    )

    assert response.headers["Access-Control-Allow-Origin"] == origin
    assert response.headers["Access-Control-Allow-Methods"] == "GET,POST"
    assert response.headers["Access-Control-Allow-Headers"] == "X-Custom-Header"
