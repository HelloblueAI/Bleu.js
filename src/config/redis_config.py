import os
from typing import Optional


class RedisConfig:
    """Redis configuration settings."""

    HOST: str = os.getenv("REDIS_HOST", "localhost")
    PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    DB: int = int(os.getenv("REDIS_DB", "0"))
    PASSWORD: Optional[str] = os.getenv("REDIS_PASSWORD")
    SSL: bool = os.getenv("REDIS_SSL", "false").lower() == "true"

    # Rate limiting settings
    RATE_LIMIT_WINDOW: int = int(os.getenv("RATE_LIMIT_WINDOW", "60"))  # seconds
    RATE_LIMIT_MAX_REQUESTS: int = int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "100"))

    # Cache settings
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", "300"))  # seconds

    @classmethod
    def get_connection_url(cls) -> str:
        """Get Redis connection URL."""
        auth = f":{cls.PASSWORD}@" if cls.PASSWORD else ""
        protocol = "rediss" if cls.SSL else "redis"
        return f"{protocol}://{auth}{cls.HOST}:{cls.PORT}/{cls.DB}"
