"""
Quantum Gate Implementation
Copyright (c) 2024, Bleu.js
"""

from typing import TYPE_CHECKING, Any, Dict, List, Optional

import numpy as np
from numpy.typing import NDArray
from qiskit.circuit import Gate
from qiskit.circuit.library import UnitaryGate

if TYPE_CHECKING:
    pass


class QuantumGate:
    """Base class for quantum gates."""

    def __init__(
        self,
        name: str,
        matrix: NDArray[np.complex128],
        target_qubits: List[int],
        control_qubits: Optional[List[int]] = None,
    ) -> None:
        self.name = name
        self.matrix = matrix
        self.target_qubits = target_qubits
        self.control_qubits = control_qubits or []
        self._validate_gate()

    def _validate_gate(self) -> None:
        # Validate matrix dimensions
        n_qubits = len(self.target_qubits)
        expected_size = 2**n_qubits
        if self.matrix.shape != (expected_size, expected_size):
            raise ValueError(f"Invalid matrix dimensions for {n_qubits} qubit gate")

        # Validate matrix is unitary
        if not np.allclose(self.matrix @ self.matrix.conj().T, np.eye(expected_size)):
            raise ValueError("Gate matrix must be unitary")

    def apply(self, state_vector: NDArray[np.complex128]) -> NDArray[np.complex128]:
        # Apply the gate to the state vector
        return self.matrix @ state_vector

    def conjugate(self) -> "QuantumGate":
        return QuantumGate(
            f"{self.name}†",
            self.matrix.conj().T,
            self.target_qubits,
            self.control_qubits,
        )

    def tensor_product(self, other: "QuantumGate") -> "QuantumGate":
        new_matrix = np.kron(self.matrix, other.matrix)
        new_targets = self.target_qubits + other.target_qubits
        new_controls = self.control_qubits + other.control_qubits
        return QuantumGate(
            f"{self.name}⊗{other.name}", new_matrix, new_targets, new_controls
        )

    def get_error_rate(self) -> float:
        # Simple error model based on gate complexity
        base_error = 0.001  # Base error rate
        complexity_factor = len(self.target_qubits) + len(self.control_qubits)
        return base_error * complexity_factor

    def to_matrix_representation(self) -> NDArray[np.complex128]:
        return self.matrix.copy()

    def get_affected_qubits(self) -> List[int]:
        return sorted(set(self.target_qubits + self.control_qubits))

    def is_compatible_with(self, other: "QuantumGate") -> bool:
        # Check if gates can be applied in parallel
        return not bool(
            set(self.get_affected_qubits()) & set(other.get_affected_qubits())
        )

    def get_properties(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "n_qubits": len(self.target_qubits),
            "is_controlled": bool(self.control_qubits),
            "error_rate": self.get_error_rate(),
            "affected_qubits": self.get_affected_qubits(),
        }

    def __str__(self) -> str:
        gate_str = f"{self.name} gate on qubits {self.target_qubits}"
        if self.control_qubits:
            gate_str += f" controlled by {self.control_qubits}"
        return gate_str

    def to_qiskit(self) -> Gate:
        """Convert to Qiskit gate."""
        return UnitaryGate(self.matrix)

    def to_cirq(self) -> Any:
        """Convert to Cirq gate."""
        from cirq.ops.matrix_gates import MatrixGate

        return MatrixGate(self.matrix, qid_shape=(2,) * len(self.target_qubits))

    @staticmethod
    def create_controlled_gate(
        gate: "QuantumGate", num_controls: int = 1
    ) -> "QuantumGate":
        """Create a controlled version of the gate."""
        controlled_matrix = np.eye(2 ** (len(gate.target_qubits) + num_controls))
        gate_matrix = gate.matrix
        dim = len(gate_matrix)
        controlled_matrix[-dim:, -dim:] = gate_matrix
        return ControlledGate(
            gate.name, len(gate.target_qubits) + num_controls, controlled_matrix
        )


class HadamardGate(QuantumGate):
    """Hadamard gate implementation."""

    def __init__(self):
        super().__init__("H", np.array([[1, 1], [1, -1]]) / np.sqrt(2), [0], None)


class PauliXGate(QuantumGate):
    """Pauli X (NOT) gate implementation."""

    def __init__(self):
        super().__init__("X", np.array([[0, 1], [1, 0]]), [0], None)


class PauliYGate(QuantumGate):
    """Pauli Y gate implementation."""

    def __init__(self):
        super().__init__("Y", np.array([[0, -1j], [1j, 0]]), [0], None)


class PauliZGate(QuantumGate):
    """Pauli Z gate implementation."""

    def __init__(self):
        super().__init__("Z", np.array([[1, 0], [0, -1]]), [0], None)


class PhaseGate(QuantumGate):
    """Phase gate implementation."""

    def __init__(self, phi: float):
        super().__init__("P", np.array([[1, 0], [0, np.exp(1j * phi)]]), [0], None)


class RotationGate(QuantumGate):
    """Rotation gate implementation."""

    def __init__(self, theta: float, axis: str = "z"):
        super().__init__(
            f"R{axis.upper()}",
            np.array([[np.exp(-1j * theta / 2), 0], [0, np.exp(1j * theta / 2)]]),
            [0],
            None,
        )


class ControlledGate(QuantumGate):
    """Controlled gate implementation."""

    def __init__(self, name: str, num_qubits: int, matrix: np.ndarray):
        super().__init__(f"C-{name}", matrix, [i for i in range(num_qubits)], None)


class SwapGate(QuantumGate):
    """SWAP gate implementation."""

    def __init__(self):
        super().__init__(
            "SWAP",
            np.array([[1, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 0], [0, 0, 0, 1]]),
            [0, 1],
            None,
        )


class ToffoliGate(QuantumGate):
    """Toffoli (CCNOT) gate implementation."""

    def __init__(self):
        super().__init__("CCX", np.eye(8), [0, 1, 2], None)
        self.matrix[6:8, 6:8] = np.array([[0, 1], [1, 0]])
