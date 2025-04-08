"""Rate limiting service module."""

from datetime import datetime, timedelta
from typing import Dict, Optional

from fastapi import HTTPException, status
from redis.asyncio import Redis

from src.config import settings


class RateLimitingService:
    """Service for handling rate limiting."""

    def __init__(self, redis: Redis) -> None:
        """Initialize rate limiting service.

        Args:
            redis: Redis client instance
        """
        self.redis = redis
        self.window = settings.RATE_LIMIT_WINDOW
        self.max_requests = settings.RATE_LIMIT_MAX_REQUESTS

    async def check_rate_limit(self, key: str) -> bool:
        """Check if request is rate limited.

        Args:
            key: Rate limit key (e.g. IP address)

        Returns:
            bool: True if rate limited, False otherwise

        Raises:
            HTTPException: If rate limit is exceeded
        """
        current = await self.redis.get(key)
        if not current:
            await self.redis.setex(key, self.window, 1)
            return False

        count = int(current)
        if count >= self.max_requests:
            retry_after = await self.get_retry_after(key)
            headers = {"Retry-After": str(retry_after)} if retry_after else {}
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests",
                headers=headers,
            )

        await self.redis.incr(key)
        return False

    async def get_retry_after(self, key: str) -> Optional[int]:
        """Get retry after time in seconds.

        Args:
            key: Rate limit key

        Returns:
            Optional[int]: Seconds until rate limit resets
        """
        ttl = await self.redis.ttl(key)
        return max(0, ttl) if ttl > 0 else None

    async def get_rate_limit_status(self, key: str) -> Dict[str, int]:
        """Get rate limit status.

        Args:
            key: Rate limit key

        Returns:
            Dict[str, int]: Rate limit status with remaining requests and reset time
        """
        current = await self.redis.get(key)
        ttl = await self.get_retry_after(key) or 0

        remaining = self.max_requests - (int(current) if current else 0)
        reset = int((datetime.now() + timedelta(seconds=ttl)).timestamp())

        return {
            "remaining": remaining,
            "reset": reset,
        }


# Create singleton instance
rate_limiter: Optional[RateLimitingService] = None
