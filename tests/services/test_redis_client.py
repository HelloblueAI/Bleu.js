import pytest

from src.config.redis_config import RedisConfig
from src.services.redis_client import RedisClient


@pytest.fixture
async def redis_client():
    """Fixture to get Redis client."""
    client = await RedisClient.get_client()
    yield client
    await RedisClient.close()


@pytest.mark.asyncio
async def test_redis_connection(redis_client):
    """Test Redis connection."""
    # Test ping
    assert await redis_client.ping() is True

    # Test set/get
    await redis_client.set("test_key", "test_value")
    value = await redis_client.get("test_key")
    assert value == "test_value"

    # Cleanup
    await redis_client.delete("test_key")


@pytest.mark.asyncio
async def test_redis_pool():
    """Test Redis connection pool."""
    # Get first client
    client1 = await RedisClient.get_client()
    assert client1 is not None

    # Get second client (should be same instance)
    client2 = await RedisClient.get_client()
    assert client2 is client1

    # Close connection
    await RedisClient.close()

    # Get new client (should be new instance)
    client3 = await RedisClient.get_client()
    assert client3 is not client1


@pytest.mark.asyncio
async def test_redis_config():
    """Test Redis configuration."""
    # Test default config
    assert RedisConfig.HOST == "localhost"
    assert RedisConfig.PORT == 6379
    assert RedisConfig.DB == 0
    assert RedisConfig.SSL is False

    # Test connection URL
    url = RedisConfig.get_connection_url()
    assert url == "redis://localhost:6379/0"

    # Test with password
    RedisConfig.PASSWORD = "test_password"
    url = RedisConfig.get_connection_url()
    assert url == "redis://:test_password@localhost:6379/0"

    # Test with SSL
    RedisConfig.SSL = True
    url = RedisConfig.get_connection_url()
    assert url == "rediss://:test_password@localhost:6379/0"

    # Reset config
    RedisConfig.PASSWORD = None
    RedisConfig.SSL = False


@pytest.mark.asyncio
async def test_redis_operations(redis_client):
    """Test Redis operations."""
    # Test hash operations
    await redis_client.hmset("test_hash", {"field1": "value1", "field2": "value2"})
    values = await redis_client.hgetall("test_hash")
    assert values == {"field1": "value1", "field2": "value2"}

    # Test expiration
    await redis_client.set("test_expire", "value")
    await redis_client.expire("test_expire", 1)
    assert await redis_client.get("test_expire") == "value"

    # Wait for expiration
    import time

    time.sleep(1)
    assert await redis_client.get("test_expire") is None

    # Cleanup
    await redis_client.delete("test_hash")


@pytest.mark.asyncio
async def test_redis_error_handling():
    """Test Redis error handling."""
    # Test invalid host
    RedisConfig.HOST = "invalid_host"
    with pytest.raises(Exception):
        await RedisClient.get_client()

    # Reset config
    RedisConfig.HOST = "localhost"
