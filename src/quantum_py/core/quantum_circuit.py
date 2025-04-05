import logging
from typing import Dict, List, Optional, Tuple

import numpy as np

from .quantum_state import QuantumState

logger = logging.getLogger(__name__)


class QuantumGate:
    """Represents a quantum gate operation."""

    def __init__(
        self,
        name: str,
        matrix: np.ndarray,
        target_qubits: List[int],
        control_qubits: Optional[List[int]] = None,
    ):
        self.name = name
        self.matrix = matrix
        self.target_qubits = target_qubits
        self.control_qubits = control_qubits or []
        self._validate()

    def _validate(self) -> None:
        """Validate gate properties."""
        if not isinstance(self.matrix, np.ndarray):
            raise ValueError("Gate matrix must be a numpy array")
        if self.matrix.shape[0] != self.matrix.shape[1]:
            raise ValueError("Gate matrix must be square")
        if not np.allclose(
            self.matrix @ self.matrix.conj().T, np.eye(len(self.matrix))
        ):
            raise ValueError("Gate matrix must be unitary")


class QuantumCircuit:
    """Enhanced quantum circuit implementation."""

    def __init__(self, num_qubits: int):
        """Initialize quantum circuit.

        Args:
            num_qubits: Number of qubits in the circuit
        """
        self.num_qubits = num_qubits
        self.gates: List[QuantumGate] = []
        self.state = QuantumState(num_qubits)
        self.measurements: Dict[int, List[Tuple[int, float]]] = {}
        self._initialize_basic_gates()

    def _initialize_basic_gates(self) -> None:
        """Initialize dictionary of basic quantum gates."""
        self.basic_gates = {
            "H": 1 / np.sqrt(2) * np.array([[1, 1], [1, -1]]),  # Hadamard
            "X": np.array([[0, 1], [1, 0]]),  # Pauli-X
            "Y": np.array([[0, -1j], [1j, 0]]),  # Pauli-Y
            "Z": np.array([[1, 0], [0, -1]]),  # Pauli-Z
            "S": np.array([[1, 0], [0, 1j]]),  # Phase
            "T": np.array([[1, 0], [0, np.exp(1j * np.pi / 4)]]),  # π/8
            "CNOT": np.array(
                [
                    [1, 0, 0, 0],  # Controlled-NOT
                    [0, 1, 0, 0],
                    [0, 0, 0, 1],
                    [0, 0, 1, 0],
                ]
            ),
            "SWAP": np.array(
                [[1, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 0], [0, 0, 0, 1]]  # SWAP
            ),
        }

    def add_gate(
        self,
        name: str,
        target_qubits: List[int],
        control_qubits: Optional[List[int]] = None,
    ) -> None:
        """Add a quantum gate to the circuit.

        Args:
            name: Name of the gate from basic_gates
            target_qubits: List of target qubit indices
            control_qubits: Optional list of control qubit indices
        """
        if name not in self.basic_gates:
            raise ValueError(f"Unknown gate: {name}")

        if max(target_qubits) >= self.num_qubits:
            raise ValueError("Target qubit index out of range")

        if control_qubits and max(control_qubits) >= self.num_qubits:
            raise ValueError("Control qubit index out of range")

        gate = QuantumGate(
            name=name,
            matrix=self.basic_gates[name],
            target_qubits=target_qubits,
            control_qubits=control_qubits,
        )
        self.gates.append(gate)

    def add_custom_gate(
        self,
        name: str,
        matrix: np.ndarray,
        target_qubits: List[int],
        control_qubits: Optional[List[int]] = None,
    ) -> None:
        """Add a custom quantum gate to the circuit."""
        gate = QuantumGate(name, matrix, target_qubits, control_qubits)
        self.gates.append(gate)

    def apply_gate(self, gate: QuantumGate) -> None:
        """Apply a quantum gate to the state."""
        try:
            # Expand gate to full system size
            full_matrix = self._expand_gate_matrix(gate)

            # Apply gate to state
            self.state.amplitudes = full_matrix @ self.state.amplitudes

            # Normalize state
            norm = np.linalg.norm(self.state.amplitudes)
            if norm > 0:
                self.state.amplitudes /= norm

        except Exception as e:
            logger.error(f"Error applying gate {gate.name}: {str(e)}")
            raise

    def _expand_gate_matrix(self, gate: QuantumGate) -> np.ndarray:
        """Expand gate matrix to operate on full Hilbert space."""
        n = self.num_qubits
        if len(gate.target_qubits) == n:
            return gate.matrix

        # Create the full operation matrix using tensor products
        ops = []
        current_qubit = 0

        for i in range(n):
            if i in gate.target_qubits:
                idx = gate.target_qubits.index(i)
                op = gate.matrix.reshape([2] * (2 * len(gate.target_qubits)))[..., idx]
            else:
                op = np.eye(2)
            ops.append(op)
            current_qubit += 1

        from functools import reduce

        return reduce(np.kron, ops)

    def measure(
        self, qubit_indices: Optional[List[int]] = None
    ) -> Dict[int, Tuple[int, float]]:
        """Measure specified qubits.

        Args:
            qubit_indices: List of qubit indices to measure. If None, measure all qubits.

        Returns:
            Dictionary mapping qubit indices to (outcome, probability) tuples
        """
        if qubit_indices is None:
            qubit_indices = list(range(self.num_qubits))

        results = {}
        for idx in qubit_indices:
            outcome, prob = self.state.measure([idx])
            results[idx] = (outcome, prob)
            self.measurements[idx] = self.measurements.get(idx, []) + [(outcome, prob)]

        return results

    def get_state(self) -> np.ndarray:
        """Get the current quantum state vector."""
        return self.state.state_vector

    def get_measurement_statistics(self, qubit_index: int) -> Dict[int, float]:
        """Get measurement statistics for a specific qubit.

        Args:
            qubit_index: Index of the qubit

        Returns:
            Dictionary mapping outcomes to their frequencies
        """
        if qubit_index not in self.measurements:
            return {}

        stats = {}
        total = len(self.measurements[qubit_index])

        for outcome, _ in self.measurements[qubit_index]:
            stats[outcome] = stats.get(outcome, 0) + 1 / total

        return stats

    def reset(self) -> None:
        """Reset the circuit to initial state."""
        self.state = QuantumState(self.num_qubits)
        self.gates.clear()
        self.measurements.clear()

    def __str__(self) -> str:
        """String representation of the circuit."""
        circuit_str = f"QuantumCircuit(num_qubits={self.num_qubits})\n"
        for i, gate in enumerate(self.gates):
            circuit_str += f"Gate {i}: {gate.name} on qubits {gate.target_qubits}"
            if gate.control_qubits:
                circuit_str += f" controlled by {gate.control_qubits}"
            circuit_str += "\n"
        return circuit_str
