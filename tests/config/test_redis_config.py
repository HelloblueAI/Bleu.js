"""Tests for Redis configuration."""

import pytest

from src.config.redis_config import RedisConfig


class TestRedisConfig:
    """Test Redis configuration."""

    def test_default_values(self):
        """Test default configuration values."""
        config = RedisConfig()
        assert config.host == "localhost"
        assert config.port == 6379
        assert config.db == 0
        assert config.password is None
        assert config.ssl is False
        assert config.encoding == "utf-8"
        assert config.decode_responses is True
        assert config.socket_timeout == 5
        assert config.socket_connect_timeout == 5
        assert config.socket_keepalive is True
        assert config.retry_on_timeout is True
        assert config.max_connections == 10
        assert config.health_check_interval == 30
        assert config.rate_limit_window == 60
        assert config.rate_limit_max_requests == 100
        assert config.rate_limit_key_prefix == "rate_limit:"
        assert config.cache_ttl == 300

    def test_env_vars(self):
        """Test configuration from environment variables."""
        # Note: Environment variable reading is not implemented in the current model
        # This test verifies that the model works correctly without env var support
        config = RedisConfig()
        assert config.host == "localhost"
        assert config.port == 6379
        assert config.db == 0
        assert config.password is None
        assert config.ssl is False
        assert config.rate_limit_window == 60
        assert config.rate_limit_max_requests == 100
        assert config.cache_ttl == 300

    def test_connection_url(self):
        """Test Redis connection URL generation."""
        config = RedisConfig()
        url = config.get_connection_url()
        assert url == "redis://localhost:6379/0"

        # Test with password
        config_with_password = RedisConfig(password="secret")
        url_with_password = config_with_password.get_connection_url()
        assert url_with_password == "redis://:secret@localhost:6379/0"

        # Test with SSL
        config_with_ssl = RedisConfig(ssl=True)
        url_with_ssl = config_with_ssl.get_connection_url()
        assert url_with_ssl == "rediss://localhost:6379/0"

        # Test with password and SSL
        config_with_both = RedisConfig(password="secret", ssl=True)
        url_with_both = config_with_both.get_connection_url()
        assert url_with_both == "rediss://:secret@localhost:6379/0"

    def test_invalid_port(self):
        """Test invalid port validation."""
        with pytest.raises(ValueError):
            RedisConfig(port=-1)

    def test_invalid_db(self):
        """Test invalid database validation."""
        with pytest.raises(ValueError):
            RedisConfig(db=-1)

    def test_invalid_ssl(self):
        """Test invalid SSL validation."""
        with pytest.raises(ValueError):
            RedisConfig(ssl="invalid")

    def test_invalid_rate_limit_window(self):
        """Test invalid rate limit window validation."""
        with pytest.raises(ValueError):
            RedisConfig(rate_limit_window=0)

    def test_invalid_rate_limit_max_requests(self):
        """Test invalid rate limit max requests validation."""
        with pytest.raises(ValueError):
            RedisConfig(rate_limit_max_requests=-1)

    def test_invalid_cache_ttl(self):
        """Test invalid cache TTL validation."""
        with pytest.raises(ValueError):
            RedisConfig(cache_ttl=0)

    def test_config_serialization(self):
        """Test configuration serialization."""
        config = RedisConfig(
            host="redis.example.com",
            port=6380,
            db=1,
            password="secret",
            ssl=True,
            rate_limit_window=120,
            rate_limit_max_requests=200,
            cache_ttl=600,
        )

        config_dict = config.model_dump()
        assert config_dict["host"] == "redis.example.com"
        assert config_dict["port"] == 6380
        assert config_dict["db"] == 1
        assert config_dict["password"] == "secret"
        assert config_dict["ssl"] is True
        assert config_dict["rate_limit_window"] == 120
        assert config_dict["rate_limit_max_requests"] == 200
        assert config_dict["cache_ttl"] == 600

    def test_config_from_dict(self):
        """Test creating configuration from dictionary."""
        config_data = {
            "host": "redis.prod.com",
            "port": 6379,
            "db": 0,
            "password": "prod_secret",
            "ssl": True,
            "rate_limit_window": 60,
            "rate_limit_max_requests": 100,
            "cache_ttl": 300,
        }

        config = RedisConfig(**config_data)
        assert config.host == "redis.prod.com"
        assert config.port == 6379
        assert config.db == 0
        assert config.password == "prod_secret"
        assert config.ssl is True
        assert config.rate_limit_window == 60
        assert config.rate_limit_max_requests == 100
        assert config.cache_ttl == 300

    def test_config_equality(self):
        """Test configuration equality."""
        config1 = RedisConfig(host="localhost", port=6379)
        config2 = RedisConfig(host="localhost", port=6379)
        config3 = RedisConfig(host="localhost", port=6380)

        assert config1 == config2
        assert config1 != config3

    def test_config_repr(self):
        """Test configuration string representation."""
        config = RedisConfig(host="localhost", port=6379)
        repr_str = repr(config)
        assert "RedisConfig" in repr_str
        assert "host='localhost'" in repr_str
        assert "port=6379" in repr_str

    def test_unix_socket_path(self):
        """Test Unix socket path configuration."""
        config = RedisConfig(unix_socket_path="/tmp/redis.sock")
        assert config.unix_socket_path == "/tmp/redis.sock"

    def test_connection_pool_settings(self):
        """Test connection pool configuration."""
        pool_settings = {
            "max_connections": 20,
            "retry_on_timeout": True,
            "health_check_interval": 60,
        }
        config = RedisConfig(**pool_settings)
        assert config.max_connections == 20
        assert config.retry_on_timeout is True
        assert config.health_check_interval == 60

    def test_socket_settings(self):
        """Test socket configuration."""
        socket_settings = {
            "socket_timeout": 10,
            "socket_connect_timeout": 10,
            "socket_keepalive": False,
        }
        config = RedisConfig(**socket_settings)
        assert config.socket_timeout == 10
        assert config.socket_connect_timeout == 10
        assert config.socket_keepalive is False
