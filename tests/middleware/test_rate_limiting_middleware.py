import pytest
from fastapi import FastAPI
from starlette.testclient import TestClient

from src.middleware.rate_limiting import RateLimitingMiddleware


@pytest.fixture
def app():
    app = FastAPI()

    @app.get("/")
    async def root():
        return {"message": "Hello World"}

    @app.get("/exempt")
    async def exempt():
        return {"message": "Exempt"}

    app.add_middleware(
        RateLimitingMiddleware, exempt_paths=["/exempt"], exempt_methods=["HEAD"]
    )
    return app


@pytest.fixture
def client(app):
    return TestClient(app)


def test_exempt_path(client):
    """Test that exempt paths are not rate limited."""
    # Make multiple requests to exempt path
    for _ in range(200):
        response = client.get("/exempt")
        assert response.status_code == 200
        assert response.json() == {"message": "Exempt"}


def test_exempt_method(client):
    """Test that exempt methods are not rate limited."""
    # Make multiple HEAD requests
    for _ in range(200):
        response = client.head("/")
        assert response.status_code == 200


def test_rate_limit_headers(client):
    """Test rate limit headers in response."""
    response = client.get("/", headers={"X-User-ID": "test_user"})
    assert response.status_code == 200
    assert "X-RateLimit-Limit" in response.headers
    assert "X-RateLimit-Reset" in response.headers


def test_rate_limit_exceeded(client):
    """Test rate limit exceeded response."""
    # Make requests up to the limit
    for _ in range(100):
        response = client.get("/", headers={"X-User-ID": "test_user"})
        assert response.status_code == 200

    # Next request should be rate limited
    response = client.get("/", headers={"X-User-ID": "test_user"})
    assert response.status_code == 429
    assert "Retry-After" in response.headers
    assert "X-RateLimit-Limit" in response.headers
    assert "X-RateLimit-Reset" in response.headers


def test_different_users(client):
    """Test rate limits for different users."""
    # User 1 makes requests
    for _ in range(100):
        response = client.get("/", headers={"X-User-ID": "user1"})
        assert response.status_code == 200

    # User 1 should be rate limited
    response = client.get("/", headers={"X-User-ID": "user1"})
    assert response.status_code == 429

    # User 2 should still be able to make requests
    response = client.get("/", headers={"X-User-ID": "user2"})
    assert response.status_code == 200


def test_different_plans(client):
    """Test rate limits for different subscription plans."""
    # Free plan user
    for _ in range(100):
        response = client.get(
            "/", headers={"X-User-ID": "free_user", "X-Subscription-Plan": "free"}
        )
        assert response.status_code == 200

    # Free plan user should be rate limited
    response = client.get(
        "/", headers={"X-User-ID": "free_user", "X-Subscription-Plan": "free"}
    )
    assert response.status_code == 429

    # Pro plan user should have higher limit
    for _ in range(5000):
        response = client.get(
            "/", headers={"X-User-ID": "pro_user", "X-Subscription-Plan": "pro"}
        )
        assert response.status_code == 200
