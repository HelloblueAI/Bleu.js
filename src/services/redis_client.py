import logging

import redis.asyncio as redis
from redis.asyncio.connection import ConnectionPool

from src.config.redis_config import RedisConfig

logger = logging.getLogger(__name__)


class RedisClient:
    """Redis client factory with connection pooling."""

    _pool: ConnectionPool | None = None
    _client: redis.Redis | None = None

    @classmethod
    async def get_client(cls) -> redis.Redis:
        """Get a Redis client instance."""
        if cls._client is None:
            try:
                redis_config = RedisConfig()
                cls._pool = ConnectionPool.from_url(
                    redis_config.get_connection_url(),
                    max_connections=10,
                    decode_responses=True,
                )
                cls._client = redis.Redis(connection_pool=cls._pool)
                await cls._client.ping()  # Test connection
                logger.info("Successfully connected to Redis")
            except Exception as e:
                logger.error(f"Failed to connect to Redis: {str(e)}")
                raise
        return cls._client

    @classmethod
    async def close(cls) -> None:
        """Close the Redis connection pool."""
        if cls._pool:
            await cls._pool.disconnect()
            cls._pool = None
            cls._client = None
            logger.info("Redis connection pool closed")
