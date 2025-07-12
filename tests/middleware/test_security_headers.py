import pytest
from fastapi import FastAPI, HTTPException
from starlette.testclient import TestClient

from src.middleware.security_headers import SecurityHeaders, SecurityHeadersMiddleware
from src.python.backend.middleware.security_headers import setup_security_headers


@pytest.fixture
def app():
    app = FastAPI()
    setup_security_headers(app)
    return app


@pytest.fixture
def client(app):
    return TestClient(app)


def test_security_headers(client):
    """Test that security headers are properly set."""
    response = client.get("/")

    # Check required security headers
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["X-XSS-Protection"] == "1; mode=block"
    assert response.headers["Referrer-Policy"] == "same-origin"
    assert (
        response.headers["Permissions-Policy"]
        == "camera=(), microphone=(), geolocation=()"
    )


def test_hsts_header_with_ssl(client, monkeypatch):
    """Test that HSTS header is set when SSL is enabled."""
    monkeypatch.setenv("SECURE_SSL_REDIRECT", "True")

    response = client.get("/")
    assert "Strict-Transport-Security" in response.headers
    assert (
        response.headers["Strict-Transport-Security"]
        == "max-age=31536000; includeSubDomains; preload"
    )


def test_hsts_header_without_ssl(client, monkeypatch):
    """Test that HSTS header is not set when SSL is disabled."""
    monkeypatch.setenv("SECURE_SSL_REDIRECT", "False")

    response = client.get("/")
    assert "Strict-Transport-Security" not in response.headers


def test_custom_security_headers():
    """Test custom security headers."""
    app = FastAPI()

    @app.get("/")
    async def root():
        return {"message": "Hello World"}

    app.add_middleware(
        SecurityHeadersMiddleware,
        csp={
            "default-src": ["'self'"],
            "script-src": ["'self'", "https://trusted.cdn.com"],
            "style-src": ["'self'", "'unsafe-inline'"],
        },
        hsts_max_age=86400,
        referrer_policy="no-referrer",
        permissions_policy={
            "camera": "()",
            "microphone": "()",
        },
    )

    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200

    # Check custom security headers
    headers = response.headers
    assert headers["Content-Security-Policy"] == (
        "default-src 'self'; "
        "script-src 'self' https://trusted.cdn.com; "
        "style-src 'self' 'unsafe-inline'"
    )
    assert headers["Strict-Transport-Security"] == "max-age=86400; includeSubDomains"
    assert headers["Referrer-Policy"] == "no-referrer"
    assert headers["Permissions-Policy"] == "camera=(), microphone=()"


def test_exempt_paths():
    """Test exempt paths from security headers."""
    app = FastAPI()

    @app.get("/")
    async def root():
        return {"message": "Hello World"}

    @app.get("/exempt")
    async def exempt():
        return {"message": "Exempt"}

    app.add_middleware(SecurityHeadersMiddleware, exempt_paths=["/exempt"])

    client = TestClient(app)

    # Check root path (should have headers)
    response = client.get("/")
    assert response.status_code == 200
    assert "X-Content-Type-Options" in response.headers

    # Check exempt path (should not have headers)
    response = client.get("/exempt")
    assert response.status_code == 200
    assert "X-Content-Type-Options" not in response.headers


def test_error_responses():
    """Test security headers in error responses."""
    app = FastAPI()

    @app.get("/error")
    async def error():
        raise HTTPException(status_code=500, detail="Test error")

    app.add_middleware(SecurityHeadersMiddleware)

    client = TestClient(app)
    response = client.get("/error")
    assert response.status_code == 500

    # Check security headers in error response
    assert "X-Content-Type-Options" in response.headers
    assert "X-Frame-Options" in response.headers
    assert "Content-Security-Policy" in response.headers


def test_invalid_headers(self):
    # Test handling of invalid security headers
    with pytest.raises(ValueError):  # Replace generic Exception with ValueError
        SecurityHeaders().validate_headers({"invalid": "header"})
