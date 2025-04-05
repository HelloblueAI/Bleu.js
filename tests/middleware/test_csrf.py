import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.python.backend.middleware.csrf import setup_csrf_protection


@pytest.fixture
def app():
    app = FastAPI()
    setup_csrf_protection(app, "test-secret-key")
    return app


@pytest.fixture
def client(app):
    return TestClient(app)


def test_csrf_token_set_on_first_request(client):
    """Test that CSRF token is set on first request."""
    response = client.get("/")
    assert "csrf_token" in response.cookies
    assert response.cookies["csrf_token"]["httponly"]
    assert response.cookies["csrf_token"]["secure"]
    assert response.cookies["csrf_token"]["samesite"] == "strict"


def test_csrf_protection_for_safe_methods(client):
    """Test that CSRF protection is not required for safe methods."""
    # Safe methods should work without CSRF token
    response = client.get("/")
    assert response.status_code == 200


def test_csrf_protection_for_unsafe_methods(client):
    """Test that CSRF protection is required for unsafe methods."""
    # First request to get CSRF token
    response = client.get("/")
    csrf_token = response.cookies["csrf_token"]

    # Try unsafe method without CSRF token
    response = client.post("/")
    assert response.status_code == 403
    assert response.text == "CSRF token missing in header"

    # Try unsafe method with invalid CSRF token
    response = client.post("/", headers={"X-CSRF-Token": "invalid-token"})
    assert response.status_code == 403
    assert response.text == "CSRF token mismatch"

    # Try unsafe method with valid CSRF token
    response = client.post("/", headers={"X-CSRF-Token": csrf_token})
    assert response.status_code == 200


def test_csrf_token_rotation(client):
    """Test that CSRF token is rotated after each request."""
    # First request
    response = client.get("/")
    first_token = response.cookies["csrf_token"]

    # Second request with first token
    response = client.post("/", headers={"X-CSRF-Token": first_token})
    assert response.status_code == 200
    second_token = response.cookies["csrf_token"]

    # Tokens should be different
    assert first_token != second_token

    # Third request with second token
    response = client.post("/", headers={"X-CSRF-Token": second_token})
    assert response.status_code == 200
    third_token = response.cookies["csrf_token"]

    # Tokens should be different
    assert second_token != third_token
