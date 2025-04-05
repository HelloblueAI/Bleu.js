import os

import pytest

from src.config.redis_config import RedisConfig


@pytest.fixture
def env_vars():
    """Fixture to set environment variables."""
    original_env = {
        "REDIS_HOST": os.getenv("REDIS_HOST"),
        "REDIS_PORT": os.getenv("REDIS_PORT"),
        "REDIS_DB": os.getenv("REDIS_DB"),
        "REDIS_PASSWORD": os.getenv("REDIS_PASSWORD"),
        "REDIS_SSL": os.getenv("REDIS_SSL"),
        "RATE_LIMIT_WINDOW": os.getenv("RATE_LIMIT_WINDOW"),
        "RATE_LIMIT_MAX_REQUESTS": os.getenv("RATE_LIMIT_MAX_REQUESTS"),
        "CACHE_TTL": os.getenv("CACHE_TTL"),
    }

    # Set test environment variables
    os.environ["REDIS_HOST"] = "test_host"
    os.environ["REDIS_PORT"] = "1234"
    os.environ["REDIS_DB"] = "1"
    os.environ["REDIS_PASSWORD"] = "test_password"
    os.environ["REDIS_SSL"] = "true"
    os.environ["RATE_LIMIT_WINDOW"] = "120"
    os.environ["RATE_LIMIT_MAX_REQUESTS"] = "200"
    os.environ["CACHE_TTL"] = "600"

    yield

    # Restore original environment variables
    for key, value in original_env.items():
        if value is not None:
            os.environ[key] = value
        else:
            os.environ.pop(key, None)


def test_default_values():
    """Test default configuration values."""
    assert RedisConfig.HOST == "localhost"
    assert RedisConfig.PORT == 6379
    assert RedisConfig.DB == 0
    assert RedisConfig.PASSWORD is None
    assert RedisConfig.SSL is False
    assert RedisConfig.RATE_LIMIT_WINDOW == 60
    assert RedisConfig.RATE_LIMIT_MAX_REQUESTS == 100
    assert RedisConfig.CACHE_TTL == 300


def test_env_vars(env_vars):
    """Test environment variable configuration."""
    assert RedisConfig.HOST == "test_host"
    assert RedisConfig.PORT == 1234
    assert RedisConfig.DB == 1
    assert RedisConfig.PASSWORD == "test_password"
    assert RedisConfig.SSL is True
    assert RedisConfig.RATE_LIMIT_WINDOW == 120
    assert RedisConfig.RATE_LIMIT_MAX_REQUESTS == 200
    assert RedisConfig.CACHE_TTL == 600


def test_connection_url():
    """Test Redis connection URL generation."""
    # Test default URL
    assert RedisConfig.get_connection_url() == "redis://localhost:6379/0"

    # Test URL with password
    RedisConfig.PASSWORD = "test_password"
    assert RedisConfig.get_connection_url() == "redis://:test_password@localhost:6379/0"

    # Test URL with SSL
    RedisConfig.SSL = True
    assert (
        RedisConfig.get_connection_url() == "rediss://:test_password@localhost:6379/0"
    )

    # Reset config
    RedisConfig.PASSWORD = None
    RedisConfig.SSL = False


def test_invalid_port():
    """Test invalid port configuration."""
    with pytest.raises(ValueError):
        RedisConfig.PORT = "invalid"


def test_invalid_db():
    """Test invalid DB configuration."""
    with pytest.raises(ValueError):
        RedisConfig.DB = "invalid"


def test_invalid_ssl():
    """Test invalid SSL configuration."""
    with pytest.raises(ValueError):
        RedisConfig.SSL = "invalid"


def test_invalid_rate_limit_window():
    """Test invalid rate limit window configuration."""
    with pytest.raises(ValueError):
        RedisConfig.RATE_LIMIT_WINDOW = "invalid"


def test_invalid_rate_limit_max_requests():
    """Test invalid rate limit max requests configuration."""
    with pytest.raises(ValueError):
        RedisConfig.RATE_LIMIT_MAX_REQUESTS = "invalid"


def test_invalid_cache_ttl():
    """Test invalid cache TTL configuration."""
    with pytest.raises(ValueError):
        RedisConfig.CACHE_TTL = "invalid"


def test_update_host():
    """Test updating host."""
    RedisConfig.update_host("new_host")
    assert RedisConfig.HOST == "new_host"

    # Reset
    RedisConfig.HOST = "test_host"


def test_update_port():
    """Test updating port."""
    RedisConfig.update_port(2345)
    assert RedisConfig.PORT == 2345

    # Reset
    RedisConfig.PORT = 1234


def test_update_db():
    """Test updating DB."""
    RedisConfig.update_db(2)
    assert RedisConfig.DB == 2

    # Reset
    RedisConfig.DB = 1


def test_update_password():
    """Test updating password."""
    RedisConfig.update_password("new_password")
    assert RedisConfig.PASSWORD == "new_password"

    # Reset
    RedisConfig.PASSWORD = "test_password"


def test_update_ssl():
    """Test updating SSL."""
    RedisConfig.update_ssl(False)
    assert RedisConfig.SSL is False

    # Reset
    RedisConfig.SSL = True


def test_update_rate_limit_window():
    """Test updating rate limit window."""
    RedisConfig.update_rate_limit_window(180)
    assert RedisConfig.RATE_LIMIT_WINDOW == 180

    # Reset
    RedisConfig.RATE_LIMIT_WINDOW = 120


def test_update_rate_limit_max_requests():
    """Test updating rate limit max requests."""
    RedisConfig.update_rate_limit_max_requests(300)
    assert RedisConfig.RATE_LIMIT_MAX_REQUESTS == 300

    # Reset
    RedisConfig.RATE_LIMIT_MAX_REQUESTS = 200


def test_update_cache_ttl():
    """Test updating cache TTL."""
    RedisConfig.update_cache_ttl(900)
    assert RedisConfig.CACHE_TTL == 900

    # Reset
    RedisConfig.CACHE_TTL = 600
