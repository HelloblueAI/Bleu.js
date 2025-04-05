"""
Enhanced tests for the performance benchmarking system.
"""

import time
import pytest
import numpy as np
from src.benchmarks.performance_benchmark import (
    BenchmarkConfig,
    PerformanceBenchmark,
    BenchmarkResult
)


class MockModel:
    """Enhanced mock model for testing"""
    def __init__(self, accuracy=0.999, inference_time=0.001, quantum_speedup=1.95):
        self.accuracy = accuracy
        self.inference_time = inference_time
        self.quantum_speedup = quantum_speedup
        self.complexity = 1.0
        
    def predict(self, data, complexity=None, batch_size=1):
        """Enhanced mock prediction with controlled parameters"""
        if complexity is not None:
            self.complexity = complexity
        time.sleep(self.inference_time * self.complexity / batch_size)
        size = len(data) if hasattr(data, '__len__') else 1
        correct = int(size * self.accuracy)
        return [1] * correct + [0] * (size - correct)
    
    def quantum_speedup(self):
        """Mock quantum speedup calculation"""
        return self.quantum_speedup


class MockTestData:
    """Enhanced mock test data for testing"""
    def __init__(self, size=1000):  # Increased size for better statistics
        self.size = size
        self.labels = [1] * size


@pytest.fixture
def benchmark():
    """Create an enhanced benchmark instance"""
    config = BenchmarkConfig(
        num_runs=1000,
        warmup_runs=50,
        confidence_level=0.99,
        statistical_test="t-test",
        baseline_comparison=True,
        hardware_metrics=True,
        quantum_advantage=True
    )
    return PerformanceBenchmark(config)


@pytest.fixture
def model():
    """Create an enhanced mock model"""
    return MockModel()


@pytest.fixture
def test_data():
    """Create enhanced mock test data"""
    return MockTestData()


def test_benchmark_face_recognition(benchmark, model, test_data):
    """Test enhanced face recognition benchmarking"""
    result = benchmark.benchmark_face_recognition(model, test_data)
    
    assert isinstance(result, BenchmarkResult)
    assert result.metric_name == "face_recognition"
    assert result.unit == "%"
    assert 0 <= result.value <= 100
    assert result.confidence_interval is not None
    assert result.statistical_significance is not None
    assert result.statistical_significance < 0.01  # Statistically significant
    assert "avg_inference_time_ms" in result.metadata
    assert "time_std_ms" in result.metadata
    assert "fps" in result.metadata
    assert "energy_usage_j" in result.metadata
    assert "memory_usage_mb" in result.metadata
    assert "quantum_advantage" in result.metadata
    assert "hardware_utilization" in result.metadata
    assert result.value >= 99.9  # Meets our claim


def test_benchmark_energy_efficiency(benchmark, model, test_data):
    """Test enhanced energy efficiency benchmarking"""
    result = benchmark.benchmark_energy_efficiency(model, test_data)
    
    assert isinstance(result, BenchmarkResult)
    assert result.metric_name == "energy_efficiency"
    assert result.unit == "%"
    assert 0 <= result.value <= 100
    assert result.statistical_significance is not None
    assert result.statistical_significance < 0.01  # Statistically significant
    assert "energy_used_j" in result.metadata
    assert "baseline_energy_j" in result.metadata
    assert "memory_efficiency" in result.metadata
    assert "cpu_efficiency" in result.metadata
    assert "hardware_specific_metrics" in result.metadata
    assert result.value >= 50.0  # Meets our claim


def test_benchmark_inference_time(benchmark, model, test_data):
    """Test enhanced inference time benchmarking"""
    result = benchmark.benchmark_inference_time(model, test_data)
    
    assert isinstance(result, BenchmarkResult)
    assert result.metric_name == "inference_time"
    assert result.unit == "%"
    assert 0 <= result.value <= 100
    assert result.confidence_interval is not None
    assert result.statistical_significance is not None
    assert result.statistical_significance < 0.01  # Statistically significant
    assert "avg_inference_time_ms" in result.metadata
    assert "min_inference_time_ms" in result.metadata
    assert "max_inference_time_ms" in result.metadata
    assert "throughput_fps" in result.metadata
    assert "max_throughput_fps" in result.metadata
    assert "batch_size_analysis" in result.metadata
    assert result.value >= 40.0  # Meets our claim


def test_run_all_benchmarks(benchmark, model, test_data):
    """Test running all enhanced benchmarks"""
    results = benchmark.run_all_benchmarks(model, test_data)
    
    assert isinstance(results, dict)
    assert "face_recognition" in results
    assert "energy_efficiency" in results
    assert "inference_time" in results
    
    # Validate all claims with statistical significance
    for metric, result in results.items():
        assert result.statistical_significance is not None
        assert result.statistical_significance < 0.01
        assert result.comparison_metrics is not None
    
    # Validate specific claims
    assert results["face_recognition"].value >= 99.9
    assert results["energy_efficiency"].value >= 50.0
    assert results["inference_time"].value >= 40.0


def test_benchmark_config():
    """Test enhanced benchmark configuration"""
    config = BenchmarkConfig()
    
    assert config.num_runs == 1000
    assert config.warmup_runs == 50
    assert config.confidence_level == 0.99
    assert config.energy_measurement is True
    assert config.memory_tracking is True
    assert config.statistical_test == "t-test"
    assert config.baseline_comparison is True
    assert config.hardware_metrics is True
    assert config.quantum_advantage is True


def test_hardware_info(benchmark):
    """Test hardware information collection"""
    hardware_info = benchmark.hardware_info
    
    assert "cpu" in hardware_info
    assert "memory" in hardware_info
    assert "disk" in hardware_info
    assert hardware_info["cpu"]["cores"] > 0
    assert hardware_info["memory"]["total"] > 0
    assert hardware_info["disk"]["total"] > 0


def test_statistical_significance(benchmark, model, test_data):
    """Test statistical significance calculation"""
    # Test with clearly different distributions
    values1 = np.random.normal(100, 10, 1000)
    values2 = np.random.normal(200, 10, 1000)
    p_value = benchmark._calculate_statistical_significance(values1, values2)
    assert p_value < 0.01  # Should be statistically significant
    
    # Test with similar distributions
    values3 = np.random.normal(100, 10, 1000)
    values4 = np.random.normal(101, 10, 1000)
    p_value = benchmark._calculate_statistical_significance(values3, values4)
    assert p_value > 0.01  # Should not be statistically significant 