"""Tests for quantum circuit implementation."""

import numpy as np
import pytest
from qiskit import QuantumCircuit
from qiskit.quantum_info import Operator, Statevector

from src.quantum.core.quantum_circuit import QuantumCircuit as CustomQuantumCircuit


@pytest.mark.quantum
@pytest.mark.quantum_simulator
class TestQuantumCircuit:
    """Test suite for quantum circuit implementation."""

    @pytest.fixture
    def custom_circuit(self):
        """Create a custom quantum circuit instance."""
        return CustomQuantumCircuit(num_qubits=2)

    def test_initialization(self, custom_circuit):
        """Test circuit initialization."""
        assert custom_circuit.num_qubits == 2
        assert custom_circuit.depth == 0
        assert len(custom_circuit.gates) == 0

    def test_add_custom_gate(self, custom_circuit):
        """Test adding custom gates."""
        # Hadamard matrix
        h_matrix = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
        custom_circuit.add_custom_gate(
            name="custom_h",
            matrix=h_matrix,
            target_qubits=[0]
        )
        assert len(custom_circuit.gates) == 1
        assert custom_circuit.depth == 1

    def test_gate_merging(self, custom_circuit):
        """Test gate merging functionality."""
        # Add two compatible gates
        h_matrix = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
        custom_circuit.add_custom_gate(
            name="h",
            matrix=h_matrix,
            target_qubits=[0]
        )
        custom_circuit.add_custom_gate(
            name="h",
            matrix=h_matrix,
            target_qubits=[1]
        )
        # Gates should be merged into same layer
        assert custom_circuit.depth == 1

    def test_measurement_statistics(self, custom_circuit, quantum_simulator):
        """Test measurement statistics calculation."""
        # Prepare |+⟩ state
        h_matrix = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
        custom_circuit.add_custom_gate(
            name="h",
            matrix=h_matrix,
            target_qubits=[0]
        )
        
        stats = custom_circuit.get_measurement_statistics(qubit_index=0)
        assert len(stats) == 2
        np.testing.assert_almost_equal(stats[0], 0.5, decimal=2)
        np.testing.assert_almost_equal(stats[1], 0.5, decimal=2)

    def test_circuit_validation(self, custom_circuit):
        """Test circuit validation checks."""
        # Invalid qubit index
        with pytest.raises(ValueError):
            custom_circuit.add_custom_gate(
                name="test",
                matrix=np.eye(2),
                target_qubits=[5]  # Invalid qubit index
            )

        # Non-unitary matrix
        non_unitary = np.array([[1, 1], [1, 1]])
        with pytest.raises(ValueError):
            custom_circuit.add_custom_gate(
                name="invalid",
                matrix=non_unitary,
                target_qubits=[0]
            )

    def test_quantum_state_evolution(self, custom_circuit, quantum_simulator):
        """Test quantum state evolution through gates."""
        # Create Bell state
        h_matrix = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
        cnot_matrix = np.array([
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 1],
            [0, 0, 1, 0]
        ])
        
        custom_circuit.add_custom_gate(
            name="h",
            matrix=h_matrix,
            target_qubits=[0]
        )
        custom_circuit.add_custom_gate(
            name="cnot",
            matrix=cnot_matrix,
            target_qubits=[0, 1]
        )
        
        # Verify Bell state
        expected_state = np.array([1, 0, 0, 1]) / np.sqrt(2)
        final_state = custom_circuit.get_statevector()
        np.testing.assert_array_almost_equal(final_state, expected_state)

    @pytest.mark.quantum_benchmark
    def test_circuit_performance(self, custom_circuit, quantum_test_utils):
        """Test circuit performance metrics."""
        random_circuit = quantum_test_utils["create_random_circuit"](
            num_qubits=2,
            depth=10,
            seed=42
        )
        
        # Convert random circuit to custom circuit
        for gate in random_circuit.data:
            if gate[0].name == "h":
                h_matrix = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
                custom_circuit.add_custom_gate(
                    name="h",
                    matrix=h_matrix,
                    target_qubits=[gate[1][0].index]
                )
            elif gate[0].name == "cx":
                cnot_matrix = np.array([
                    [1, 0, 0, 0],
                    [0, 1, 0, 0],
                    [0, 0, 0, 1],
                    [0, 0, 1, 0]
                ])
                custom_circuit.add_custom_gate(
                    name="cnot",
                    matrix=cnot_matrix,
                    target_qubits=[gate[1][0].index, gate[1][1].index]
                )
        
        # Verify circuit metrics
        assert custom_circuit.depth <= 10  # Due to potential gate merging
        assert len(custom_circuit.gates) > 0 