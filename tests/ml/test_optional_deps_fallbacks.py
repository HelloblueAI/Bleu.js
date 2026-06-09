"""Tests for optional-dependency fallbacks (quantum, torch) in ML modules."""

import builtins

import numpy as np
import pytest

import src.ml.optimization.gpu_memory_manager as gpu_memory_manager
import src.ml.optimize as optimize
from src.ml.enhanced_xgboost import QuantumFeatureConfig, QuantumFeatureProcessor


def test_quantum_processor_falls_back_without_qiskit(monkeypatch):
    """Quantum features pass through when Qiskit is unavailable."""
    real_import = builtins.__import__

    def mock_import(name, globals=None, locals=None, fromlist=(), level=0):
        if name == "qiskit":
            raise ImportError("mock qiskit missing")
        return real_import(name, globals, locals, fromlist, level)

    monkeypatch.setattr(builtins, "__import__", mock_import)

    processor = QuantumFeatureProcessor(QuantumFeatureConfig(n_qubits=4))
    assert processor.quantum_available is False
    assert processor.quantum_circuit is None

    features = np.random.default_rng(0).random((8, 4))
    np.testing.assert_array_equal(processor.process_features(features), features)


def test_require_torch_raises_when_torch_missing(monkeypatch, tmp_path):
    """Neural-network helpers fail clearly when torch is not installed."""
    monkeypatch.setattr(optimize, "torch", None)
    monkeypatch.setattr(optimize, "nn", None)
    monkeypatch.setattr(optimize, "DataLoader", None)
    monkeypatch.setattr(optimize, "TensorDataset", None)

    with pytest.raises(RuntimeError, match=r"bleu-js\[deep\]"):
        optimize._require_torch()

    model_optimizer = optimize.ModelOptimizer(
        data_path=str(tmp_path / "missing.csv"),
        output_dir=str(tmp_path / "out"),
    )
    with pytest.raises(RuntimeError, match=r"bleu-js\[deep\]"):
        model_optimizer.create_neural_network(input_dim=4)


def test_gpu_manager_initializes_without_torch(monkeypatch):
    """GPU manager uses mock device stats when torch is unavailable."""
    monkeypatch.setattr(gpu_memory_manager, "torch", None)

    manager = gpu_memory_manager.QuantumGPUManager(devices=[0])
    stats = manager.device_stats[0]

    assert stats["compute_capability"] == "0.0"
    assert stats["total_memory"] == 8 * 1024 * 1024 * 1024
    assert stats["reserved_quantum"] == int(
        stats["total_memory"] * manager.quantum_reserve
    )


def test_optimize_memory_layout_without_torch(monkeypatch):
    """Memory layout optimization skips CUDA calls when torch is missing."""
    monkeypatch.setattr(gpu_memory_manager, "torch", None)

    manager = gpu_memory_manager.QuantumGPUManager(devices=[0])
    # Low allocation => high fragmentation score (1 - allocated/total) triggers compaction path
    manager.device_stats[0]["allocated"] = 1 * 1024 * 1024 * 1024
    manager._optimize_memory_layout()
    assert manager.device_stats[0]["fragmentation"] > manager.max_fragmentation


@pytest.mark.skipif(optimize.torch is None, reason="torch not installed")
def test_require_torch_returns_modules_when_available():
    """_require_torch exposes torch modules when deep extra is installed."""
    torch_module, torch_nn, data_loader_cls, tensor_dataset_cls = (
        optimize._require_torch()
    )
    assert torch_module is optimize.torch
    assert torch_nn is optimize.nn
    assert data_loader_cls is optimize.DataLoader
    assert tensor_dataset_cls is optimize.TensorDataset


@pytest.mark.skipif(optimize.torch is None, reason="torch not installed")
def test_create_neural_network_with_torch(tmp_path):
    """ModelOptimizer builds a torch model when deep deps are present."""
    optimizer = optimize.ModelOptimizer(
        data_path=str(tmp_path / "data.csv"),
        output_dir=str(tmp_path / "out"),
    )
    model = optimizer.create_neural_network(input_dim=4)
    assert model is not None


@pytest.mark.skipif(optimize.torch is None, reason="torch not installed")
def test_train_neural_network_with_torch(tmp_path):
    """Refactored train path uses _require_torch imports end-to-end."""
    import pandas as pd

    optimizer = optimize.ModelOptimizer(
        data_path=str(tmp_path / "data.csv"),
        output_dir=str(tmp_path / "out"),
    )
    features = np.random.default_rng(0).random((32, 4)).astype(np.float32)
    targets = pd.Series(
        np.random.default_rng(1).integers(0, 2, size=32).astype(np.float32)
    )
    params = {"batch_size": 8, "epochs": 1, "learning_rate": 0.01}
    model = optimizer.train_neural_network(features, targets, params)
    assert model is not None
