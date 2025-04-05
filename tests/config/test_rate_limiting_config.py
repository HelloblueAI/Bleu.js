import os

import pytest

from src.config.rate_limiting_config import RateLimitingConfig


@pytest.fixture
def env_vars():
    """Fixture to set environment variables."""
    original_env = {
        "RATE_LIMIT_WINDOW": os.getenv("RATE_LIMIT_WINDOW"),
        "RATE_LIMIT_MAX_REQUESTS": os.getenv("RATE_LIMIT_MAX_REQUESTS"),
        "RATE_LIMIT_FREE": os.getenv("RATE_LIMIT_FREE"),
        "RATE_LIMIT_BASIC": os.getenv("RATE_LIMIT_BASIC"),
        "RATE_LIMIT_PRO": os.getenv("RATE_LIMIT_PRO"),
        "RATE_LIMIT_ENTERPRISE": os.getenv("RATE_LIMIT_ENTERPRISE"),
        "RATE_LIMIT_EXEMPT_PATHS": os.getenv("RATE_LIMIT_EXEMPT_PATHS"),
        "RATE_LIMIT_EXEMPT_METHODS": os.getenv("RATE_LIMIT_EXEMPT_METHODS"),
    }

    # Set test environment variables
    os.environ["RATE_LIMIT_WINDOW"] = "120"
    os.environ["RATE_LIMIT_MAX_REQUESTS"] = "200"
    os.environ["RATE_LIMIT_FREE"] = "100"
    os.environ["RATE_LIMIT_BASIC"] = "1000"
    os.environ["RATE_LIMIT_PRO"] = "5000"
    os.environ["RATE_LIMIT_ENTERPRISE"] = "20000"
    os.environ["RATE_LIMIT_EXEMPT_PATHS"] = "/health,/metrics"
    os.environ["RATE_LIMIT_EXEMPT_METHODS"] = "HEAD,OPTIONS"

    yield

    # Restore original environment variables
    for key, value in original_env.items():
        if value is not None:
            os.environ[key] = value
        else:
            os.environ.pop(key, None)


def test_default_values():
    """Test default configuration values."""
    assert RateLimitingConfig.WINDOW == 60
    assert RateLimitingConfig.MAX_REQUESTS == 100
    assert RateLimitingConfig.PLANS == {
        "free": 100,
        "basic": 1000,
        "pro": 5000,
        "enterprise": 20000,
    }
    assert RateLimitingConfig.EXEMPT_PATHS == []
    assert RateLimitingConfig.EXEMPT_METHODS == ["OPTIONS"]


def test_env_vars(env_vars):
    """Test environment variable configuration."""
    assert RateLimitingConfig.WINDOW == 120
    assert RateLimitingConfig.MAX_REQUESTS == 200
    assert RateLimitingConfig.PLANS == {
        "free": 100,
        "basic": 1000,
        "pro": 5000,
        "enterprise": 20000,
    }
    assert RateLimitingConfig.EXEMPT_PATHS == ["/health", "/metrics"]
    assert RateLimitingConfig.EXEMPT_METHODS == ["HEAD", "OPTIONS"]


def test_invalid_window():
    """Test invalid window configuration."""
    with pytest.raises(ValueError):
        RateLimitingConfig.WINDOW = "invalid"


def test_invalid_max_requests():
    """Test invalid max requests configuration."""
    with pytest.raises(ValueError):
        RateLimitingConfig.MAX_REQUESTS = "invalid"


def test_invalid_plan_limit():
    """Test invalid plan limit configuration."""
    with pytest.raises(ValueError):
        RateLimitingConfig.PLANS["free"] = "invalid"


def test_invalid_exempt_paths():
    """Test invalid exempt paths configuration."""
    with pytest.raises(ValueError):
        RateLimitingConfig.EXEMPT_PATHS = "invalid"


def test_invalid_exempt_methods():
    """Test invalid exempt methods configuration."""
    with pytest.raises(ValueError):
        RateLimitingConfig.EXEMPT_METHODS = "invalid"


def test_get_plan_limit():
    """Test getting plan limit."""
    assert RateLimitingConfig.get_plan_limit("free") == 100
    assert RateLimitingConfig.get_plan_limit("basic") == 1000
    assert RateLimitingConfig.get_plan_limit("pro") == 5000
    assert RateLimitingConfig.get_plan_limit("enterprise") == 20000
    assert RateLimitingConfig.get_plan_limit("invalid") == 100  # Default to free plan


def test_is_exempt_path():
    """Test path exemption check."""
    assert RateLimitingConfig.is_exempt_path("/health") is True
    assert RateLimitingConfig.is_exempt_path("/metrics") is True
    assert RateLimitingConfig.is_exempt_path("/api") is False


def test_is_exempt_method():
    """Test method exemption check."""
    assert RateLimitingConfig.is_exempt_method("HEAD") is True
    assert RateLimitingConfig.is_exempt_method("OPTIONS") is True
    assert RateLimitingConfig.is_exempt_method("GET") is False


def test_update_plan_limit():
    """Test updating plan limit."""
    RateLimitingConfig.update_plan_limit("free", 200)
    assert RateLimitingConfig.get_plan_limit("free") == 200

    # Reset to default
    RateLimitingConfig.update_plan_limit("free", 100)


def test_add_exempt_path():
    """Test adding exempt path."""
    RateLimitingConfig.add_exempt_path("/api")
    assert RateLimitingConfig.is_exempt_path("/api") is True

    # Reset
    RateLimitingConfig.EXEMPT_PATHS = ["/health", "/metrics"]


def test_add_exempt_method():
    """Test adding exempt method."""
    RateLimitingConfig.add_exempt_method("GET")
    assert RateLimitingConfig.is_exempt_method("GET") is True

    # Reset
    RateLimitingConfig.EXEMPT_METHODS = ["HEAD", "OPTIONS"]


def test_update_window():
    """Test updating window."""
    RateLimitingConfig.update_window(180)
    assert RateLimitingConfig.WINDOW == 180

    # Reset
    RateLimitingConfig.WINDOW = 120


def test_update_max_requests():
    """Test updating max requests."""
    RateLimitingConfig.update_max_requests(300)
    assert RateLimitingConfig.MAX_REQUESTS == 300

    # Reset
    RateLimitingConfig.MAX_REQUESTS = 200


def test_remove_exempt_path():
    """Test removing exempt path."""
    RateLimitingConfig.remove_exempt_path("/health")
    assert RateLimitingConfig.is_exempt_path("/health") is False

    # Reset
    RateLimitingConfig.EXEMPT_PATHS = ["/health", "/metrics"]


def test_remove_exempt_method():
    """Test removing exempt method."""
    RateLimitingConfig.remove_exempt_method("HEAD")
    assert RateLimitingConfig.is_exempt_method("HEAD") is False

    # Reset
    RateLimitingConfig.EXEMPT_METHODS = ["HEAD", "OPTIONS"]
