"""Performance benchmarks for critical paths in the application."""

import asyncio
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Tuple

import aiohttp
import numpy as np
import pytest

from src.ml.enhanced_xgboost import EnhancedXGBoost
from src.ml.metrics import PerformanceMetrics
from src.quantum_py.quantum.quantum_processor import QuantumProcessor
from src.services.rate_limiting_service import RateLimitingService
from src.services.subscription_service import SubscriptionService


class TestPerformanceBenchmarks:
    """Performance benchmark tests for critical system components."""

    @pytest.fixture
    def large_dataset(self):
        """Generate a large dataset for benchmarking."""
        rng = np.random.default_rng(42)
        return rng.standard_normal((10000, 100))

    @pytest.fixture
    def quantum_processor(self):
        """Initialize quantum processor for benchmarking."""
        return QuantumProcessor()

    @pytest.fixture
    def subscription_service(self):
        """Initialize subscription service for benchmarking."""
        return SubscriptionService()

    @pytest.fixture
    def rate_limiting_service(self):
        """Initialize rate limiting service for benchmarking."""
        return RateLimitingService()

    def measure_execution_time(self, func, *args, **kwargs) -> float:
        """Measure execution time of a function."""
        start_time = time.perf_counter()
        func(*args, **kwargs)
        return time.perf_counter() - start_time

    async def measure_async_execution_time(self, func, *args, **kwargs) -> float:
        """Measure execution time of an async function."""
        start_time = time.perf_counter()
        await func(*args, **kwargs)
        return time.perf_counter() - start_time

    def test_quantum_circuit_execution_performance(self, quantum_processor):
        """Benchmark quantum circuit execution performance."""
        execution_times = []

        for _ in range(100):
            circuit = quantum_processor.create_circuit(4)
            circuit.h(0)
            circuit.cx(0, 1)
            circuit.measure_all()

            execution_time = self.measure_execution_time(
                quantum_processor.execute_circuit, circuit
            )
            execution_times.append(execution_time)

        avg_time = np.mean(execution_times)
        percentile_95 = np.percentile(execution_times, 95)

        assert avg_time < 0.1  # Average execution time should be under 100ms
        assert percentile_95 < 0.2  # 95th percentile should be under 200ms

    @pytest.mark.asyncio
    async def test_subscription_service_performance(self, subscription_service):
        """Benchmark subscription service performance under load."""

        async def make_subscription_request():
            return await subscription_service.get_subscription_async("test_user")

        # Simulate concurrent requests
        tasks = [make_subscription_request() for _ in range(100)]
        start_time = time.perf_counter()
        await asyncio.gather(*tasks)
        total_time = time.perf_counter() - start_time

        assert total_time < 5.0  # Total time for 100 concurrent requests

    def test_ml_pipeline_performance(self, large_dataset):
        """Benchmark ML pipeline performance."""
        model = EnhancedXGBoost()
        X = large_dataset
        y = (X[:, 0] > 0).astype(int)

        # Measure training time
        train_time = self.measure_execution_time(model.fit, X, y)
        assert train_time < 30.0  # Training should complete within 30 seconds

        # Measure prediction time
        prediction_time = self.measure_execution_time(model.predict, X)
        assert prediction_time < 1.0  # Predictions should complete within 1 second

        # Measure batch prediction performance
        with ThreadPoolExecutor() as executor:
            start_time = time.perf_counter()
            list(executor.map(model.predict, np.array_split(X, 10)))
            batch_time = time.perf_counter() - start_time

        assert batch_time < 2.0  # Batch predictions should complete within 2 seconds

    def test_rate_limiting_performance(self, rate_limiting_service):
        """Benchmark rate limiting service performance."""

        def make_request():
            return rate_limiting_service.check_rate_limit("test_user")

        # Test single-threaded performance
        single_times = []
        for _ in range(1000):
            single_times.append(self.measure_execution_time(make_request))

        assert np.mean(single_times) < 0.001  # Average under 1ms

        # Test multi-threaded performance
        with ThreadPoolExecutor(max_workers=10) as executor:
            start_time = time.perf_counter()
            list(executor.map(lambda _: make_request(), range(1000)))
            concurrent_time = time.perf_counter() - start_time

        assert concurrent_time < 1.0  # Concurrent requests under 1 second

    @pytest.mark.asyncio
    async def test_api_endpoint_performance(self):
        """Benchmark API endpoint performance."""

        async def measure_response_time(session, endpoint):
            start_time = time.perf_counter()
            async with session.get(endpoint) as response:
                await response.json()
            return time.perf_counter() - start_time

        endpoints = [
            "http://localhost:8000/api/v1/subscriptions",
            "http://localhost:8000/api/v1/quantum/status",
            "http://localhost:8000/api/v1/ml/predict",
        ]

        async with aiohttp.ClientSession() as session:
            tasks = []
            for endpoint in endpoints:
                for _ in range(50):  # 50 requests per endpoint
                    tasks.append(measure_response_time(session, endpoint))

            response_times = await asyncio.gather(*tasks)

            for endpoint_times in np.array_split(response_times, len(endpoints)):
                avg_time = np.mean(endpoint_times)
                p95_time = np.percentile(endpoint_times, 95)
                assert avg_time < 0.2  # Average response time under 200ms
                assert p95_time < 0.5  # 95th percentile under 500ms

    def test_memory_usage(self, large_dataset):
        """Benchmark memory usage of critical operations."""
        import os

        import psutil

        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss

        # Perform memory-intensive operation
        model = EnhancedXGBoost()
        model.fit(large_dataset, (large_dataset[:, 0] > 0).astype(int))

        final_memory = process.memory_info().rss
        memory_increase = (final_memory - initial_memory) / 1024 / 1024  # MB

        assert memory_increase < 1000  # Memory increase should be under 1GB

    def test_performance_metrics(self):
        # Test performance metrics calculation
        metrics = PerformanceMetrics()
        rng = np.random.default_rng(seed=42)
        data = rng.random((1000, 10))
        _ = metrics.calculate(data)


def generate_test_data(
    n_samples: int = 1000, n_features: int = 20
) -> Tuple[np.ndarray, np.ndarray]:
    """Generate test data for performance testing."""
    rng = np.random.default_rng(seed=42)
    X = rng.standard_normal((n_samples, n_features))
    y = rng.integers(0, 2, size=n_samples)
    return X, y


def test_performance():
    """Test performance metrics."""
    # Test performance metrics calculation
    metrics = PerformanceMetrics()
    rng = np.random.default_rng(seed=42)
    data = rng.random((1000, 10))
    _ = metrics.calculate(data)
