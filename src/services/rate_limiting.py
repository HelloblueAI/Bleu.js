"""Rate limiting service module."""

import time
from typing import Optional

from redis.asyncio import Redis


class RateLimitingService:
    """Service for managing rate limiting."""

    def __init__(self, redis: Redis) -> None:
        """Initialize rate limiting service.

        Args:
            redis: Redis client instance
        """
        self.redis = redis

    async def check_rate_limit(
        self,
        client_id: str,
        max_requests: int,
        window_seconds: int,
    ) -> bool:
        """Check if client has exceeded rate limit.

        Args:
            client_id: Client identifier
            max_requests: Maximum number of requests per window
            window_seconds: Window size in seconds

        Returns:
            bool: True if client has not exceeded rate limit
        """
        # Get current window key
        window_key = self._get_window_key(client_id, window_seconds)

        # Get current request count
        count = await self.redis.get(window_key)
        if not count:
            # First request in window
            pipeline = self.redis.pipeline()
            pipeline.set(window_key, 1)
            pipeline.expire(window_key, window_seconds)
            await pipeline.execute()
            return True

        # Check if limit exceeded
        count = int(count)
        if count >= max_requests:
            return False

        # Increment request count
        await self.redis.incr(window_key)
        return True

    async def get_remaining_requests(
        self,
        client_id: str,
        max_requests: int,
        window_seconds: int,
    ) -> int:
        """Get remaining requests for client.

        Args:
            client_id: Client identifier
            max_requests: Maximum number of requests per window
            window_seconds: Window size in seconds

        Returns:
            int: Number of remaining requests
        """
        # Get current window key
        window_key = self._get_window_key(client_id, window_seconds)

        # Get current request count
        count = await self.redis.get(window_key)
        if not count:
            return max_requests

        # Calculate remaining requests
        count = int(count)
        return max(0, max_requests - count)

    async def get_window_reset_time(
        self,
        client_id: str,
        window_seconds: int,
    ) -> int:
        """Get time until rate limit window resets.

        Args:
            client_id: Client identifier
            window_seconds: Window size in seconds

        Returns:
            int: Seconds until window resets
        """
        # Get current window key
        window_key = self._get_window_key(client_id, window_seconds)

        # Get TTL of window
        ttl = await self.redis.ttl(window_key)
        if ttl < 0:
            return window_seconds

        return ttl

    async def clear_rate_limit(
        self,
        client_id: str,
        window_seconds: int,
    ) -> None:
        """Clear rate limit for client.

        Args:
            client_id: Client identifier
            window_seconds: Window size in seconds
        """
        # Get current window key
        window_key = self._get_window_key(client_id, window_seconds)

        # Delete window key
        await self.redis.delete(window_key)

    def _get_window_key(self, client_id: str, window_seconds: int) -> str:
        """Get Redis key for rate limit window.

        Args:
            client_id: Client identifier
            window_seconds: Window size in seconds

        Returns:
            str: Redis key
        """
        # Calculate window start time
        window_start = int(time.time() / window_seconds) * window_seconds
        return f"rate_limit:{client_id}:{window_start}"
