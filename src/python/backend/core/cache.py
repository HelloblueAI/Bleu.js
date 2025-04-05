"""
Advanced caching system for the backend.
"""

import asyncio
import hashlib
import json
import logging
import pickle
from dataclasses import dataclass
from datetime import datetime
from functools import wraps
from typing import Any, Dict, List, Optional

import aioredis
from aioredis import Redis

logger = logging.getLogger(__name__)


@dataclass
class CacheConfig:
    """Cache configuration."""

    redis_url: str
    default_ttl: int = 3600
    max_memory: str = "2gb"
    compression_threshold: int = 1024
    batch_size: int = 100
    cache_warming_enabled: bool = True


@dataclass
class CacheStats:
    """Cache statistics."""

    hits: int = 0
    misses: int = 0
    evictions: int = 0
    memory_usage: int = 0
    last_cleanup: Optional[datetime] = None


class AdvancedCache:
    """Advanced caching system with distributed caching and cache warming."""

    def __init__(self, config: CacheConfig):
        """Initialize cache system."""
        self.config = config
        self.redis: Optional[Redis] = None
        self.stats = CacheStats()
        self._init_task = asyncio.create_task(self._setup_redis())
        self._setup_cleanup_task()

    async def _setup_redis(self):
        """Setup Redis connection."""
        try:
            self.redis = await aioredis.from_url(
                self.config.redis_url, encoding="utf-8", decode_responses=True
            )
            await self.redis.config_set("maxmemory", self.config.max_memory)
            await self.redis.config_set("maxmemory-policy", "allkeys-lru")
            logger.info("Redis connection established")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise

    def _setup_cleanup_task(self):
        """Setup periodic cleanup task."""
        asyncio.create_task(self._periodic_cleanup())

    async def _periodic_cleanup(self):
        """Periodic cache cleanup."""
        while True:
            try:
                await self.cleanup()
                await asyncio.sleep(3600)  # Run every hour
            except Exception as e:
                logger.error(f"Cache cleanup failed: {e}")
                await asyncio.sleep(60)  # Retry after 1 minute

    def _generate_key(self, key: str, prefix: str = "") -> str:
        """Generate cache key with prefix."""
        return f"{prefix}:{key}" if prefix else key

    def _serialize(self, value: Any) -> str:
        """Serialize value for storage."""
        if isinstance(value, (str, int, float, bool, type(None))):
            return json.dumps(value)
        return pickle.dumps(value)

    def _deserialize(self, value: str) -> Any:
        """Deserialize stored value."""
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return pickle.loads(value)

    async def get(self, key: str, prefix: str = "") -> Optional[Any]:
        """Get value from cache."""
        try:
            if not self.redis:
                logger.error("Redis connection not initialized")
                return None

            cache_key = self._generate_key(key, prefix)
            value = await self.redis.get(cache_key)

            if value:
                self.stats.hits += 1
                return self._deserialize(value)

            self.stats.misses += 1
            return None
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None

    async def set(
        self, key: str, value: Any, ttl: Optional[int] = None, prefix: str = ""
    ) -> bool:
        """Set value in cache."""
        try:
            if not self.redis:
                logger.error("Redis connection not initialized")
                return False

            cache_key = self._generate_key(key, prefix)
            serialized = self._serialize(value)
            if ttl:
                return await self.redis.setex(cache_key, ttl, serialized)
            return await self.redis.set(cache_key, serialized)
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False

    async def delete(self, key: str, prefix: str = "") -> bool:
        """Delete value from cache."""
        try:
            if not self.redis:
                logger.error("Redis connection not initialized")
                return False

            cache_key = self._generate_key(key, prefix)
            return await self.redis.delete(cache_key)
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return False

    async def exists(self, key: str, prefix: str = "") -> bool:
        """Check if key exists in cache."""
        try:
            if not self.redis:
                logger.error("Redis connection not initialized")
                return False

            cache_key = self._generate_key(key, prefix)
            return await self.redis.exists(cache_key)
        except Exception as e:
            logger.error(f"Cache exists error: {e}")
            return False

    async def increment(
        self, key: str, amount: int = 1, prefix: str = ""
    ) -> Optional[int]:
        """Increment value in cache."""
        try:
            if not self.redis:
                logger.error("Redis connection not initialized")
                return None

            cache_key = self._generate_key(key, prefix)
            return await self.redis.incrby(cache_key, amount)
        except Exception as e:
            logger.error(f"Cache increment error: {e}")
            return None

    async def batch_get(self, keys: List[str], prefix: str = "") -> Dict[str, Any]:
        """Get multiple values from cache."""
        try:
            if not self.redis:
                logger.error("Redis connection not initialized")
                return {}

            cache_keys = [self._generate_key(key, prefix) for key in keys]
            values = await self.redis.mget(cache_keys)
            return {
                k: self._deserialize(v) for k, v in zip(keys, values) if v is not None
            }
        except Exception as e:
            logger.error(f"Cache batch get error: {e}")
            return {}

    async def batch_set(
        self, items: Dict[str, Any], ttl: Optional[int] = None, prefix: str = ""
    ) -> bool:
        """Set multiple values in cache."""
        try:
            if not self.redis:
                logger.error("Redis connection not initialized")
                return False

            if ttl is None:
                ttl = self.config.default_ttl

            pipeline = self.redis.pipeline()
            for key, value in items.items():
                cache_key = self._generate_key(key, prefix)
                serialized = self._serialize(value)
                pipeline.setex(cache_key, ttl, serialized)

            await pipeline.execute()
            return True
        except Exception as e:
            logger.error(f"Cache batch set error: {e}")
            return False

    async def cleanup(self):
        """Clean up expired keys and update statistics."""
        try:
            if not self.redis:
                logger.error("Redis connection not initialized")
                return

            info = await self.redis.info()
            self.stats.memory_usage = info["used_memory"]
            self.stats.evictions = info["evicted_keys"]
            self.stats.last_cleanup = datetime.utcnow()

            # Trigger Redis cleanup
            await self.redis.execute_command("MEMORY PURGE")
        except Exception as e:
            logger.error(f"Cache cleanup error: {e}")

    def cache_decorator(
        self, prefix: str = "", ttl: Optional[int] = None, key_prefix: str = ""
    ):
        """Decorator for caching function results."""

        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Generate cache key from function arguments
                key_parts = [key_prefix, func.__name__]
                key_parts.extend(str(arg) for arg in args)
                key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
                cache_key = hashlib.sha256(":".join(key_parts).encode()).hexdigest()

                # Try to get from cache
                cached_value = await self.get(cache_key, prefix)
                if cached_value is not None:
                    return cached_value

                # Execute function and cache result
                result = await func(*args, **kwargs)
                await self.set(cache_key, result, ttl, prefix)
                return result

            return wrapper

        return decorator

    async def warm_cache(self, items: Dict[str, Any], prefix: str = ""):
        """Warm up cache with pre-computed values."""
        if not self.config.cache_warming_enabled:
            return

        try:
            await self.batch_set(items, prefix=prefix)
            logger.info(f"Cache warmed with {len(items)} items")
        except Exception as e:
            logger.error(f"Cache warming failed: {e}")

    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return {
            "hits": self.stats.hits,
            "misses": self.stats.misses,
            "hit_rate": (
                self.stats.hits / (self.stats.hits + self.stats.misses)
                if (self.stats.hits + self.stats.misses) > 0
                else 0
            ),
            "evictions": self.stats.evictions,
            "memory_usage": self.stats.memory_usage,
            "last_cleanup": (
                self.stats.last_cleanup.isoformat() if self.stats.last_cleanup else None
            ),
        }

    async def close(self):
        """Close Redis connection."""
        if self.redis:
            await self.redis.close()


# Create global cache instance
cache_manager = AdvancedCache(
    CacheConfig(
        redis_url="redis://localhost:6379/0",
        default_ttl=3600,
        max_memory="2gb",
        compression_threshold=1024,
        batch_size=100,
        cache_warming_enabled=True,
    )
)


def _generate_cache_key(func, *args, **kwargs) -> str:
    """Generate a cache key for the function and its arguments."""
    key_parts = [func.__module__, func.__name__]
    key_parts.extend(str(arg) for arg in args)
    key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
    cache_key = hashlib.sha256(":".join(key_parts).encode()).hexdigest()
    return cache_key
