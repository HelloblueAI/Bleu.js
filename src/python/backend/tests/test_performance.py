"""
Tests for the performance optimization system.
"""

import asyncio
from datetime import datetime

import pytest

from ..core.performance import PerformanceMetrics, PerformanceOptimizer

# Create test optimizer instance
optimizer = PerformanceOptimizer(
    {
        "max_workers": 2,
        "memory_threshold": 1024,  # 1KB for testing
        "cache_ttl": 1,
        "batch_size": 2,
        "max_concurrent": 2,
    }
)


@pytest.mark.asyncio
async def test_function_profiling():
    """Test function profiling decorator."""

    @optimizer.profile_function
    async def test_function():
        await asyncio.sleep(0.1)  # Simulate work
        return "success"

    result = await test_function()
    assert result == "success"

    # Check profiling results
    assert test_function.__name__ in optimizer.profiling_results
    profile = optimizer.profiling_results[test_function.__name__]
    assert profile.total_time >= 0.1
    assert profile.calls == 1
    assert profile.memory_allocated >= 0
    assert profile.memory_freed >= 0


@pytest.mark.asyncio
async def test_memory_optimization():
    """Test memory optimization decorator."""

    @optimizer.optimize_memory
    async def memory_intensive():
        # Create some memory pressure
        large_list = [i for i in range(10000)]
        await asyncio.sleep(0.1)
        return len(large_list)

    result = await memory_intensive()
    assert result == 10000

    # Memory issues should be logged if they exceed threshold
    # This is handled by the decorator internally


@pytest.mark.asyncio
async def test_parallel_execution():
    """Test parallel execution decorator."""

    @optimizer.parallel_execution
    async def slow_operation():
        await asyncio.sleep(0.1)
        return "success"

    result = await slow_operation()
    assert result == "success"


@pytest.mark.asyncio
async def test_batch_processing():
    """Test batch processing decorator."""

    @optimizer.batch_processing(batch_size=2, max_concurrent=2)
    async def process_batch(data):
        await asyncio.sleep(0.1)
        return [x * 2 for x in data]

    input_data = [1, 2, 3, 4, 5]
    result = await process_batch(input_data)
    assert len(result) == 5
    assert result == [2, 4, 6, 8, 10]


@pytest.mark.asyncio
async def test_performance_metrics():
    """Test performance metrics collection."""

    @optimizer.profile_function
    async def test_metrics():
        await asyncio.sleep(0.1)
        return "success"

    await test_metrics()

    # Check metrics history
    assert len(optimizer.metrics_history) > 0
    metrics = optimizer.metrics_history[-1]
    assert isinstance(metrics, PerformanceMetrics)
    assert metrics.execution_time >= 0.1
    assert metrics.memory_usage >= 0
    assert metrics.cpu_usage >= 0
    assert metrics.io_operations >= 0
    assert isinstance(metrics.timestamp, datetime)


@pytest.mark.asyncio
async def test_performance_report():
    """Test performance report generation."""

    # Generate some metrics
    @optimizer.profile_function
    async def generate_metrics():
        await asyncio.sleep(0.1)
        return "success"

    for _ in range(3):
        await generate_metrics()

    report = await optimizer.get_performance_report()

    assert "execution_time" in report
    assert "memory_usage" in report
    assert "cpu_usage" in report
    assert "profiling_results" in report
    assert "timestamp" in report

    # Check statistics
    assert report["execution_time"]["mean"] >= 0.1
    assert report["execution_time"]["min"] >= 0.1
    assert report["execution_time"]["max"] >= 0.1
    assert report["execution_time"]["std"] >= 0


@pytest.mark.asyncio
async def test_resource_optimization():
    """Test resource optimization."""

    # Generate some metrics first
    @optimizer.profile_function
    async def generate_metrics():
        await asyncio.sleep(0.1)
        return "success"

    for _ in range(3):
        await generate_metrics()

    # Optimize resources
    await optimizer.optimize_resources()

    # Check that resources were cleared
    assert len(optimizer.memory_snapshots) == 0
    assert len(optimizer.metrics_history) == 0
    assert len(optimizer.profiling_results) == 0


def test_cleanup():
    """Test cleanup of resources."""
    optimizer.cleanup()
    # No assertions needed as this is just cleanup
    # If it runs without errors, it's successful
