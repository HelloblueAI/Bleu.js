"""
Advanced performance optimization system for the backend.
"""

import asyncio
import cProfile
import io
import logging
import pstats
import time
import tracemalloc
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import datetime
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, TypeVar

import numpy as np
import psutil

logger = logging.getLogger(__name__)

T = TypeVar("T")


@dataclass
class PerformanceMetrics:
    """Performance metrics data."""

    execution_time: float
    memory_usage: float
    cpu_usage: float
    io_operations: int
    timestamp: datetime


@dataclass
class ProfilingResult:
    """Profiling result data."""

    function_name: str
    total_time: float
    calls: int
    time_per_call: float
    cumulative_time: float
    memory_allocated: int
    memory_freed: int


class PerformanceOptimizer:
    """Advanced performance optimization system."""

    def __init__(self, config: Dict[str, Any]):
        """Initialize performance optimizer."""
        self.config = config
        self._setup_profiling()
        self._setup_memory_tracking()
        self._setup_resource_monitoring()
        self.metrics_history: List[PerformanceMetrics] = []
        self.profiling_results: Dict[str, ProfilingResult] = {}

    def _setup_profiling(self):
        """Setup profiling tools."""
        self.profiler = cProfile.Profile()
        tracemalloc.start()

    def _setup_memory_tracking(self):
        """Setup memory tracking."""
        self.memory_snapshots: List[tracemalloc.Snapshot] = []

    def _setup_resource_monitoring(self):
        """Setup resource monitoring."""
        self.process = psutil.Process()
        self.thread_pool = ThreadPoolExecutor(
            max_workers=self.config.get("max_workers", 4)
        )

    def profile_function(self, func: Callable[..., T]) -> Callable[..., T]:
        """Decorator for profiling function performance."""

        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Start profiling
            self.profiler.enable()

            # Take memory snapshot
            snapshot1 = tracemalloc.take_snapshot()

            # Start timing
            start_time = time.time()

            try:
                # Execute function
                result = await func(*args, **kwargs)

                # Calculate metrics
                execution_time = time.time() - start_time
                memory_snapshot2 = tracemalloc.take_snapshot()

                # Calculate memory statistics
                memory_stats = memory_snapshot2.compare_to(snapshot1, "lineno")
                memory_allocated = sum(
                    stat.size for stat in memory_stats if stat.size > 0
                )
                memory_freed = abs(
                    sum(stat.size for stat in memory_stats if stat.size < 0)
                )

                # Get profiling stats
                self.profiler.disable()
                stats_stream = io.StringIO()
                stats = pstats.Stats(self.profiler, stream=stats_stream)
                stats.sort_stats("cumulative")
                stats.print_stats()

                # Parse profiling results
                stats_lines = stats_stream.getvalue().split("\n")
                for line in stats_lines:
                    if func.__name__ in line:
                        parts = line.split()
                        if len(parts) >= 5:
                            self.profiling_results[func.__name__] = ProfilingResult(
                                function_name=func.__name__,
                                total_time=float(parts[2]),
                                calls=int(parts[1]),
                                time_per_call=float(parts[3]),
                                cumulative_time=float(parts[4]),
                                memory_allocated=memory_allocated,
                                memory_freed=memory_freed,
                            )

                # Record metrics
                self.metrics_history.append(
                    PerformanceMetrics(
                        execution_time=execution_time,
                        memory_usage=memory_allocated,
                        cpu_usage=self.process.cpu_percent(),
                        io_operations=self.process.io_counters().read_count
                        + self.process.io_counters().write_count,
                        timestamp=datetime.utcnow(),
                    )
                )

                return result

            finally:
                # Cleanup
                self.profiler.disable()
                self.memory_snapshots.append(snapshot1)

        return wrapper

    def optimize_memory(self, func: Callable[..., T]) -> Callable[..., T]:
        """Decorator for memory optimization."""

        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Take initial memory snapshot
            snapshot1 = tracemalloc.take_snapshot()

            try:
                result = await func(*args, **kwargs)

                # Take final memory snapshot
                snapshot2 = tracemalloc.take_snapshot()

                # Analyze memory usage
                memory_stats = snapshot2.compare_to(snapshot1, "lineno")
                memory_issues = [
                    stat
                    for stat in memory_stats
                    if stat.size
                    > self.config.get("memory_threshold", 1024 * 1024)  # 1MB
                ]

                if memory_issues:
                    logger.warning(
                        "memory_issues_detected",
                        function=func.__name__,
                        issues=memory_issues,
                    )

                return result

            finally:
                # Cleanup
                self.memory_snapshots.append(snapshot1)

        return wrapper

    def parallel_execution(self, func: Callable[..., T]) -> Callable[..., T]:
        """Decorator for parallel execution."""

        @wraps(func)
        async def wrapper(*args, **kwargs):
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(
                self.thread_pool, lambda: asyncio.run(func(*args, **kwargs))
            )

        return wrapper

    def cache_result(
        self, ttl: int = 3600, key_prefix: str = ""
    ) -> Callable[[Callable[..., T]], Callable[..., T]]:
        """Decorator for caching function results."""

        def decorator(func: Callable[..., T]) -> Callable[..., T]:
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Generate cache key
                key_parts = [key_prefix, func.__name__]
                key_parts.extend(str(arg) for arg in args)
                key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
                cache_key = ":".join(key_parts)

                # Try to get from cache
                cached_result = await self._get_from_cache(cache_key)
                if cached_result is not None:
                    return cached_result

                # Execute function and cache result
                result = await func(*args, **kwargs)
                await self._store_in_cache(cache_key, result, ttl)
                return result

            return wrapper

        return decorator

    async def _get_from_cache(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        # Implementation depends on your caching system

    async def _store_in_cache(self, key: str, value: Any, ttl: int):
        """Store value in cache."""
        # Implementation depends on your caching system

    def batch_processing(
        self, batch_size: int = 100, max_concurrent: int = 10
    ) -> Callable[[Callable[..., T]], Callable[..., T]]:
        """Decorator for batch processing."""

        def decorator(func: Callable[..., T]) -> Callable[..., T]:
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Split input into batches
                input_data = args[0] if args else kwargs.get("data", [])
                batches = [
                    input_data[i : i + batch_size]
                    for i in range(0, len(input_data), batch_size)
                ]

                # Process batches concurrently
                tasks = []
                for batch in batches:
                    if len(tasks) >= max_concurrent:
                        await asyncio.gather(*tasks)
                        tasks = []
                    tasks.append(func(batch, **kwargs))

                if tasks:
                    await asyncio.gather(*tasks)

            return wrapper

        return decorator

    async def get_performance_report(self) -> Dict[str, Any]:
        """Generate comprehensive performance report."""
        if not self.metrics_history:
            return {}

        # Calculate statistics
        execution_times = [m.execution_time for m in self.metrics_history]
        memory_usage = [m.memory_usage for m in self.metrics_history]
        cpu_usage = [m.cpu_usage for m in self.metrics_history]

        return {
            "execution_time": {
                "mean": np.mean(execution_times),
                "median": np.median(execution_times),
                "std": np.std(execution_times),
                "min": np.min(execution_times),
                "max": np.max(execution_times),
            },
            "memory_usage": {
                "mean": np.mean(memory_usage),
                "median": np.median(memory_usage),
                "std": np.std(memory_usage),
                "min": np.min(memory_usage),
                "max": np.max(memory_usage),
            },
            "cpu_usage": {
                "mean": np.mean(cpu_usage),
                "median": np.median(cpu_usage),
                "std": np.std(cpu_usage),
                "min": np.min(cpu_usage),
                "max": np.max(cpu_usage),
            },
            "profiling_results": self.profiling_results,
            "timestamp": datetime.utcnow().isoformat(),
        }

    async def optimize_resources(self):
        """Optimize system resources."""
        # Clear memory
        tracemalloc.clear_traces()
        self.memory_snapshots.clear()

        # Reset profiler
        self.profiler.clear()

        # Optimize thread pool
        cpu_count = psutil.cpu_count()
        if cpu_count is None:
            cpu_count = 1  # Default to 1 if cpu_count returns None
        self.thread_pool._max_workers = min(
            self.config.get("max_workers", 4), cpu_count * 2
        )

        # Clear metrics history
        self.metrics_history.clear()

    def cleanup(self):
        """Cleanup resources."""
        self.thread_pool.shutdown(wait=True)
        tracemalloc.stop()


# Create global performance optimizer instance
performance_optimizer = PerformanceOptimizer(
    {
        "max_workers": 4,
        "memory_threshold": 1024 * 1024,  # 1MB
        "cache_ttl": 3600,
        "batch_size": 100,
        "max_concurrent": 10,
    }
)
