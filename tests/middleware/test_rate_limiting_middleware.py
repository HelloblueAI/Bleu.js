import pytest
from fastapi import FastAPI
from starlette.testclient import TestClient

from src.middleware.rate_limiting import RateLimitingMiddleware


class MockRateLimitingService:
    """Mock rate limiting service for testing."""

    def __init__(self):
        self.request_counts = {}

    async def check_rate_limit(
        self, client_id: str, max_requests: int, window_seconds: int
    ) -> bool:
        """Mock rate limit check."""
        if client_id not in self.request_counts:
            self.request_counts[client_id] = 0

        if self.request_counts[client_id] >= max_requests:
            return False

        self.request_counts[client_id] += 1
        return True

    async def get_remaining_requests(
        self, client_id: str, max_requests: int, window_seconds: int
    ) -> int:
        """Mock remaining requests calculation."""
        current = self.request_counts.get(client_id, 0)
        return max(0, max_requests - current)

    async def get_window_reset_time(self, client_id: str, window_seconds: int) -> int:
        """Mock window reset time."""
        return 60  # Mock 60 seconds


@pytest.fixture
def rate_limiting_service():
    """Mock rate limiting service for testing."""
    return MockRateLimitingService()


@pytest.fixture
def app(rate_limiting_service):
    app = FastAPI()

    @app.get("/")
    async def root():
        return {"message": "Hello World"}

    @app.get("/exempt")
    async def exempt():
        return {"message": "Exempt"}

    app.add_middleware(
        RateLimitingMiddleware,
        rate_limiting_service=rate_limiting_service,
        exclude_paths=["/exempt"],
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


def test_rate_limit_headers(client):
    """Test rate limit headers in response."""
    response = client.get("/", headers={"X-User-ID": "test_user"})
    assert response.status_code == 200
    assert "X-RateLimit-Limit" in response.headers
    assert "X-RateLimit-Remaining" in response.headers
    assert "X-RateLimit-Reset" in response.headers


def test_rate_limit_exceeded(client):
    """Test rate limit exceeded response."""
    # Make requests up to the limit (default is 100)
    for _ in range(100):
        response = client.get("/", headers={"X-User-ID": "test_user"})
        assert response.status_code == 200

    # Next request should be rate limited
    response = client.get("/", headers={"X-User-ID": "test_user"})
    assert response.status_code == 429
    assert "Retry-After" in response.headers


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
