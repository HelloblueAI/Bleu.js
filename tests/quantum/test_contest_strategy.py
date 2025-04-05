"""Tests for Bleujs quantum contest optimization."""

import numpy as np
import pytest
import tensorflow as tf
from qiskit import QuantumCircuit

from src.python.ml.computer_vision.quantum_attention import QuantumAttention
from src.python.ml.computer_vision.quantum_fusion import QuantumFusion
from src.quantum_py.optimization.contest_strategy import BleuQuantumContestOptimizer


@pytest.fixture
def optimizer():
    """Create a BleuQuantumContestOptimizer instance."""
    return BleuQuantumContestOptimizer()


@pytest.fixture
def attention_weights():
    """Create sample attention weights."""
    return tf.random.normal([1, 8, 8, 64])


@pytest.fixture
def feature_list():
    """Create sample feature tensors."""
    return [
        tf.random.normal([1, 32, 32, 64]),
        tf.random.normal([1, 32, 32, 32]),
        tf.random.normal([1, 32, 32, 16]),
    ]


def test_optimizer_initialization():
    """Test optimizer initialization."""
    attention = QuantumAttention()
    fusion = QuantumFusion()
    optimizer = BleuQuantumContestOptimizer(
        attention_module=attention,
        fusion_module=fusion,
    )

    assert optimizer.attention_module is not None
    assert optimizer.fusion_module is not None
    assert optimizer.backend is not None
    assert optimizer.shots == 1024


def test_optimize_attention_mapping(optimizer, attention_weights):
    """Test attention mapping optimization."""
    optimized_weights, circuit = optimizer.optimize_attention_mapping(attention_weights)

    assert isinstance(optimized_weights, tf.Tensor)
    assert isinstance(circuit, QuantumCircuit)
    assert optimized_weights.shape == attention_weights.shape


def test_optimize_fusion_strategy(optimizer, feature_list):
    """Test feature fusion optimization."""
    optimized_features, circuit = optimizer.optimize_fusion_strategy(feature_list)

    assert isinstance(optimized_features, tf.Tensor)
    assert isinstance(circuit, QuantumCircuit)
    assert optimized_features.shape[-1] == sum(f.shape[-1] for f in feature_list)


def test_quantum_circuit_optimization(optimizer):
    """Test quantum circuit optimization."""
    circuit = QuantumCircuit(4)
    circuit.h(range(4))
    circuit.cx(0, 1)
    circuit.cx(2, 3)

    optimized_circuit = optimizer._optimize_quantum_circuit(circuit)

    assert isinstance(optimized_circuit, QuantumCircuit)
    assert len(optimized_circuit.data) <= len(circuit.data)


def test_invalid_inputs(optimizer):
    """Test handling of invalid inputs."""
    with pytest.raises(ValueError):
        optimizer._prepare_quantum_state(None)

    with pytest.raises(ValueError):
        optimizer._process_quantum_result(None, (1, 1))

    with pytest.raises(ValueError):
        optimizer._apply_circuit_to_weights(None, QuantumCircuit(1))

    with pytest.raises(ValueError):
        optimizer._apply_circuit_to_features([], QuantumCircuit(1))


def test_end_to_end_optimization(optimizer, attention_weights, feature_list):
    """Test end-to-end optimization pipeline."""
    # Test attention optimization
    opt_weights, att_circuit = optimizer.optimize_attention_mapping(attention_weights)
    assert opt_weights is not None
    assert att_circuit is not None

    # Test fusion optimization
    opt_features, fusion_circuit = optimizer.optimize_fusion_strategy(feature_list)
    assert opt_features is not None
    assert fusion_circuit is not None

    # Verify shapes
    assert opt_weights.shape == attention_weights.shape
    assert opt_features.shape[-1] == sum(f.shape[-1] for f in feature_list)
