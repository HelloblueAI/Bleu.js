"""Tests for quantum fusion module."""

import numpy as np
import pytest
import torch
from qiskit_aer import Aer

from src.python.ml.computer_vision.quantum_fusion import (
    QuantumFusion,
    QuantumFusionConfig,
    QuantumFusionLayer,
)


@pytest.fixture
def config():
    """Create test configuration."""
    return QuantumFusionConfig(
        num_qubits=2,
        feature_dims=[4, 4],
        fusion_dim=8,
        num_layers=2,
        dropout_rate=0.1,
        use_entanglement=True,
        use_superposition=True,
        use_adaptive_fusion=True,
        rotation_angle=np.pi / 4,
    )


@pytest.fixture
def quantum_fusion(config):
    """Create quantum fusion instance."""
    return QuantumFusion(config)


@pytest.fixture
def sample_features():
    """Create sample feature tensors."""
    return [
        torch.rand((10, 4), dtype=torch.float32),
        torch.rand((10, 4), dtype=torch.float32),
    ]


def test_initialization(config):
    """Test quantum fusion initialization."""
    quantum_fusion = QuantumFusion(config)
    assert quantum_fusion.config == config
    assert quantum_fusion.quantum_circuit is not None
    assert quantum_fusion.qr is not None
    assert quantum_fusion.cr is not None
    assert quantum_fusion.initialized is True


def test_quantum_circuit_building(config):
    """Test quantum circuit building."""
    quantum_fusion = QuantumFusion(config)
    circuit = quantum_fusion.quantum_circuit
    assert circuit is not None
    assert circuit.num_qubits == config.num_qubits
    assert circuit.num_clbits == config.num_qubits


def test_feature_fusion(quantum_fusion, sample_features):
    """Test feature fusion."""
    fused = quantum_fusion.fuse_features(sample_features)
    assert isinstance(fused, torch.Tensor)
    assert fused.shape == (10, 8)  # batch_size x fusion_dim


def test_quantum_state_preparation(quantum_fusion, sample_features):
    """Test quantum state preparation."""
    # Test single input
    features = sample_features[0][0]  # Get first feature vector
    quantum_state = quantum_fusion._prepare_quantum_state(features)
    assert isinstance(quantum_state, np.ndarray)
    assert quantum_state.dtype == np.complex128
    assert quantum_state.shape == (2**quantum_fusion.config.num_qubits,)

    # Test batch input
    features = sample_features[0]  # Get all feature vectors
    quantum_state = quantum_fusion._prepare_quantum_state(features)
    assert isinstance(quantum_state, np.ndarray)
    assert quantum_state.dtype == np.complex128
    assert quantum_state.shape == (
        10,
        2**quantum_fusion.config.num_qubits,
    )  # batch_size x state_size


def test_quantum_gate_application(quantum_fusion, sample_features):
    """Test quantum gate application."""
    features = sample_features[0]
    quantum_state = quantum_fusion._prepare_quantum_state(features)
    enhanced_state = quantum_fusion._apply_quantum_circuit(quantum_state)
    assert isinstance(enhanced_state, np.ndarray)
    assert enhanced_state.dtype == np.complex128
    assert enhanced_state.shape == quantum_state.shape


def test_error_handling(quantum_fusion):
    """Test error handling."""
    # Test None features
    with pytest.raises(ValueError):
        quantum_fusion._prepare_quantum_state(None)

    # Test empty features
    with pytest.raises(ValueError):
        quantum_fusion._prepare_quantum_state(torch.zeros((0, 0)))

    # Test invalid quantum state
    with pytest.raises(ValueError):
        quantum_fusion._apply_quantum_circuit(None)


def test_backend_execution(quantum_fusion, sample_features):
    """Test backend execution."""
    # Set up backend
    backend = Aer.get_backend("qasm_simulator")
    quantum_fusion.backend = backend

    # Test feature fusion with backend
    fused = quantum_fusion.fuse_features(sample_features)
    assert isinstance(fused, torch.Tensor)
    assert fused.shape == (10, 8)


def test_cleanup(quantum_fusion):
    """Test resource cleanup."""
    # Force cleanup
    quantum_fusion.__del__()

    # Verify cleanup
    assert quantum_fusion.quantum_circuit is None
    assert quantum_fusion.qr is None
    assert quantum_fusion.cr is None
    assert quantum_fusion.backend is None
    assert len(quantum_fusion._state_cache) == 0


def test_quantum_fusion_layer(config):
    """Test quantum fusion layer."""
    layer = QuantumFusionLayer(config)
    assert layer.config == config

    # Test layer call
    features = [torch.rand((10, 4)) for _ in range(2)]
    output = layer(features)
    assert isinstance(output, torch.Tensor)
    assert output.shape == (10, 8)  # batch_size x fusion_dim
