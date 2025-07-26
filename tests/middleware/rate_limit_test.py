import time

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.middleware.rate_limiter import RateLimiterMiddleware


@pytest.fixture
def app():
    app = FastAPI()
    # Create a mock rate limiter service
    from unittest.mock import Mock

    mock_rate_limiter = Mock()
    app.add_middleware(RateLimiterMiddleware, rate_limiter=mock_rate_limiter)
    return app


@pytest.fixture
def client(app):
    return TestClient(app)


def test_rate_limit_allows_requests_within_limit(client):
    """Test that requests within the rate limit are allowed."""
    # Make 5 requests (within limit)
    for _ in range(5):
        response = client.get("/")
        assert response.status_code == 200


def test_rate_limit_blocks_excessive_requests(client):
    """Test that requests exceeding the rate limit are blocked."""
    # Make 5 requests (within limit)
    for _ in range(5):
        client.get("/")

    # 6th request should be blocked
    response = client.get("/")
    assert response.status_code == 429
    assert "Rate limit exceeded" in response.text


def test_rate_limit_resets_after_time_window(client):
    """Test that rate limit resets after the time window."""
    # Make 5 requests (within limit)
    for _ in range(5):
        client.get("/")

    # 6th request should be blocked
    response = client.get("/")
    assert response.status_code == 429

    # Wait for time window to expire
    time.sleep(61)

    # New request should be allowed
    response = client.get("/")
    assert response.status_code == 200


def test_rate_limit_headers(client):
    """Test that rate limit headers are properly set."""
    response = client.get("/")

    # Check rate limit headers
    assert "X-RateLimit-Limit" in response.headers
    assert "X-RateLimit-Remaining" in response.headers
    assert "X-RateLimit-Reset" in response.headers

    # Verify header values
    assert response.headers["X-RateLimit-Limit"] == "5"
    assert response.headers["X-RateLimit-Remaining"] == "4"

    # Make 4 more requests
    for _ in range(4):
        client.get("/")

    # Check remaining is 0
    response = client.get("/")
    assert response.headers["X-RateLimit-Remaining"] == "0"
