"""
Quantum Gate Implementation
Copyright (c) 2024, Bleu.js
"""

from typing import TYPE_CHECKING, List, Optional, Union

import numpy as np
from qiskit.circuit import Gate
from qiskit.circuit.library import UnitaryGate

if TYPE_CHECKING:
    from cirq.ops.matrix_gates import MatrixGate
    from cirq.ops.gate_features import SingleQubitGate, TwoQubitGate


class QuantumGate:
    """Base class for quantum gates."""

    def __init__(self, name: str, num_qubits: int):
        self.name = name
        self.num_qubits = num_qubits
        self._matrix: Optional[np.ndarray] = None

    @property
    def matrix(self) -> np.ndarray:
        """Returns the unitary matrix representation of the gate."""
        if self._matrix is None:
            raise NotImplementedError("Gate matrix not implemented")
        return self._matrix

    def to_qiskit(self) -> Gate:
        """Convert to Qiskit gate."""
        return UnitaryGate(self.matrix, label=self.name)

    def to_cirq(self) -> Union["SingleQubitGate", "TwoQubitGate"]:
        """Convert to Cirq gate."""
        from cirq.ops.matrix_gates import MatrixGate
        return MatrixGate(self.matrix, qid_shape=(2,) * self.num_qubits)

    @staticmethod
    def create_controlled_gate(
        gate: "QuantumGate", num_controls: int = 1
    ) -> "QuantumGate":
        """Create a controlled version of the gate."""
        controlled_matrix = np.eye(2 ** (gate.num_qubits + num_controls))
        gate_matrix = gate.matrix
        dim = len(gate_matrix)
        controlled_matrix[-dim:, -dim:] = gate_matrix
        return ControlledGate(
            gate.name, gate.num_qubits + num_controls, controlled_matrix
        )


class HadamardGate(QuantumGate):
    """Hadamard gate implementation."""

    def __init__(self):
        super().__init__("H", 1)
        self._matrix = np.array([[1, 1], [1, -1]]) / np.sqrt(2)


class PauliXGate(QuantumGate):
    """Pauli X (NOT) gate implementation."""

    def __init__(self):
        super().__init__("X", 1)
        self._matrix = np.array([[0, 1], [1, 0]])


class PauliYGate(QuantumGate):
    """Pauli Y gate implementation."""

    def __init__(self):
        super().__init__("Y", 1)
        self._matrix = np.array([[0, -1j], [1j, 0]])


class PauliZGate(QuantumGate):
    """Pauli Z gate implementation."""

    def __init__(self):
        super().__init__("Z", 1)
        self._matrix = np.array([[1, 0], [0, -1]])


class PhaseGate(QuantumGate):
    """Phase gate implementation."""

    def __init__(self, phi: float):
        super().__init__("P", 1)
        self._matrix = np.array([[1, 0], [0, np.exp(1j * phi)]])


class RotationGate(QuantumGate):
    """Rotation gate implementation."""

    def __init__(self, theta: float, axis: str = "z"):
        super().__init__(f"R{axis.upper()}", 1)
        c = np.cos(theta / 2)
        s = np.sin(theta / 2)

        if axis.lower() == "x":
            self._matrix = np.array([[c, -1j * s], [-1j * s, c]])
        elif axis.lower() == "y":
            self._matrix = np.array([[c, -s], [s, c]])
        elif axis.lower() == "z":
            self._matrix = np.array(
                [[np.exp(-1j * theta / 2), 0], [0, np.exp(1j * theta / 2)]]
            )
        else:
            raise ValueError("Axis must be 'x', 'y', or 'z'")


class ControlledGate(QuantumGate):
    """Controlled gate implementation."""

    def __init__(self, name: str, num_qubits: int, matrix: np.ndarray):
        super().__init__(f"C-{name}", num_qubits)
        self._matrix = matrix


class SwapGate(QuantumGate):
    """SWAP gate implementation."""

    def __init__(self):
        super().__init__("SWAP", 2)
        self._matrix = np.array(
            [[1, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 0], [0, 0, 0, 1]]
        )


class ToffoliGate(QuantumGate):
    """Toffoli (CCNOT) gate implementation."""

    def __init__(self):
        super().__init__("CCX", 3)
        self._matrix = np.eye(8)
        self._matrix[6:8, 6:8] = np.array([[0, 1], [1, 0]])
