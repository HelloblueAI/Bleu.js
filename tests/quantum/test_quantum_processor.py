"""Tests for the quantum processor component."""

import numpy as np
import pytest
from qiskit import execute

from src.quantum_py.quantum.quantum_config import QuantumConfig
from src.quantum_py.quantum.quantum_ml import QuantumML
from src.quantum_py.quantum.quantum_processor import QuantumProcessor
from src.quantum_py.quantum.self_learning import QuantumSelfLearning


def test_quantum_processor_initialization():
    """Test quantum processor initialization."""
    config = QuantumConfig(num_qubits=4, shots=1000, optimization_level=3)
    processor = QuantumProcessor(config)
    assert processor.config.num_qubits == 4
    assert processor.config.shots == 1000
    assert processor.config.optimization_level == 3


def test_quantum_circuit_creation(basic_quantum_circuit):
    """Test creation of quantum circuits."""
    processor = QuantumProcessor()
    circuit = processor.create_circuit(2)
    assert circuit.num_qubits == basic_quantum_circuit.num_qubits
    assert circuit.num_clbits == basic_quantum_circuit.num_clbits


def test_entanglement_generation(quantum_simulator, entangled_state_circuit):
    """Test generation of entangled states."""
    result = execute(entangled_state_circuit, quantum_simulator).result()
    counts = result.get_counts()

    # Verify we only get |00⟩ and |11⟩ states
    assert set(counts.keys()).issubset({"00", "11"})
    # Verify approximate equal distribution
    total_shots = sum(counts.values())
    assert abs(counts.get("00", 0) / total_shots - 0.5) < 0.1
    assert abs(counts.get("11", 0) / total_shots - 0.5) < 0.1


@pytest.mark.parametrize(
    "input_data",
    [np.array([1, 0]), np.array([0, 1]), np.array([1 / np.sqrt(2), 1 / np.sqrt(2)])],
)
def test_quantum_encoding(input_data):
    """Test quantum encoding of classical data."""
    processor = QuantumProcessor()
    circuit = processor.encode_data(input_data)
    assert circuit is not None
    assert circuit.num_qubits >= len(input_data)


def test_quantum_measurement(quantum_simulator, entangled_state_circuit):
    """Test quantum measurement process."""
    processor = QuantumProcessor()
    result = processor.measure_state(entangled_state_circuit)
    assert isinstance(result, dict)
    assert "counts" in result
    assert "statevector" in result


@pytest.mark.asyncio
async def test_quantum_error_correction():
    """Test quantum error correction capabilities."""
    processor = QuantumProcessor()
    circuit = processor.create_circuit(3)  # 3 qubits for basic error correction
    # Add error correction code
    processor.add_error_correction(circuit)
    # Simulate an error
    circuit.x(1)  # Bit flip on qubit 1
    # Correct the error
    corrected_circuit = processor.correct_errors(circuit)
    assert corrected_circuit is not None


def test_quantum_self_learning_integration():
    """Test integration with quantum self-learning module."""
    processor = QuantumProcessor()
    learner = QuantumSelfLearning(processor)

    # Train on simple dataset
    X = np.array([[0, 1], [1, 0]])
    y = np.array([0, 1])

    learner.train(X, y)
    prediction = learner.predict(np.array([0, 1]))
    assert prediction in [0, 1]


@pytest.mark.parametrize("noise_level", [0.01, 0.05, 0.1])
def test_noise_resilience(noise_level):
    """Test quantum processor's resilience to noise."""
    processor = QuantumProcessor()
    circuit = processor.create_circuit(2)

    # Add noise to the circuit
    noisy_circuit = processor.add_noise(circuit, noise_level)
    result = processor.execute_circuit(noisy_circuit)

    # Check if results are still valid despite noise
    assert result is not None
    assert "error_rate" in result
    assert result["error_rate"] < noise_level * 2  # Error should be bounded


def test_circuit_optimization():
    """Test quantum circuit optimization."""
    processor = QuantumProcessor()
    circuit = processor.create_circuit(4)

    # Add some gates
    circuit.h(0)
    circuit.cx(0, 1)
    circuit.h(1)
    circuit.cx(1, 2)

    # Optimize the circuit
    optimized_circuit = processor.optimize_circuit(circuit)

    # Check if the optimized circuit has fewer operations
    assert optimized_circuit.size() <= circuit.size()


def test_quantum_processor_error_handling():
    """Test error handling in quantum processor."""
    processor = QuantumProcessor()

    with pytest.raises(ValueError):
        processor.create_circuit(-1)  # Invalid number of qubits

    with pytest.raises(ValueError):
        processor.create_circuit(1000)  # Too many qubits

    with pytest.raises(ValueError):
        processor.encode_data(np.array([]))  # Empty input data


def test_quantum_feature_processing():
    """Test quantum feature processing."""
    config = QuantumConfig(num_qubits=4, shots=1000, optimization_level=3)
    processor = QuantumProcessor(config)
    rng = np.random.default_rng(42)
    features = rng.random((10, 4))
    processed_features = processor.process_features(features)
    assert processed_features.shape == (10, 16)  # 2^4 = 16 possible states


def test_quantum_processor():
    """Test quantum processor functionality."""
    rng = np.random.default_rng(seed=42)
    test_data = rng.random((10, 5))
    processor = QuantumML()
    result = processor.process_features(test_data)
    assert result.shape == test_data.shape


def test_quantum_processing(self):
    # Test quantum processing functionality
    rng = np.random.default_rng(seed=42)
    data = rng.random((100, 10))
    _ = QuantumProcessor().process(data)  # Remove unused processor variable
