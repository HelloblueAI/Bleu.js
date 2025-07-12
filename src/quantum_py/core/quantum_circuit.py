import logging
from typing import Any, Dict, FrozenSet, List, Optional, Set

import numpy as np
from qiskit import QuantumCircuit as QiskitCircuit
from qiskit.circuit import Parameter
from qiskit.quantum_info import Operator, Statevector

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
    """Wrapper around Qiskit's QuantumCircuit with additional functionality."""

    def __init__(self, num_qubits: int):
        """Initialize quantum circuit."""
        self.num_qubits = num_qubits
        self.circuit: QiskitCircuit = QiskitCircuit(num_qubits)
        self._parameters: List[Parameter] = []
        self.stats: Dict[str, Any] = {"gate_count": 0, "depth": 0, "error_rate": 0.0}
        self._initialize_circuit()

    def _initialize_circuit(self) -> None:
        self.circuit.reset(range(self.num_qubits))
        self._update_stats()

    def _update_stats(self) -> None:
        self.stats["gate_count"] = self.circuit.size()
        self.stats["depth"] = self.circuit.depth()
        self.stats["error_rate"] = self._calculate_error_rate()

    def _calculate_error_rate(self) -> float:
        # Simple error model: error rate increases with circuit depth
        base_error = 0.001  # Base error rate per gate
        return min(base_error * self.stats["depth"], 1.0)

    def add_gate(
        self,
        gate_name: str,
        target_qubits: List[int],
        control_qubits: Optional[List[int]] = None,
        params: Optional[List[float]] = None,
    ) -> None:
        """Add a quantum gate to the circuit."""
        if control_qubits is None:
            control_qubits = []
        gate_dispatch = {
            "H": self._add_h_gate,
            "X": self._add_x_gate,
            "Y": self._add_y_gate,
            "Z": self._add_z_gate,
            "CNOT": self._add_cnot_gate,
            "RX": self._add_rx_gate,
            "RY": self._add_ry_gate,
            "RZ": self._add_rz_gate,
        }
        if gate_name in gate_dispatch:
            gate_dispatch[gate_name](target_qubits, control_qubits, params)
        else:
            raise ValueError(f"Unsupported gate: {gate_name}")

    def _add_h_gate(self, target_qubits, control_qubits, params):
        for qubit in target_qubits:
            self.circuit.h(qubit)

    def _add_x_gate(self, target_qubits, control_qubits, params):
        for qubit in target_qubits:
            self.circuit.x(qubit)

    def _add_y_gate(self, target_qubits, control_qubits, params):
        for qubit in target_qubits:
            self.circuit.y(qubit)

    def _add_z_gate(self, target_qubits, control_qubits, params):
        for qubit in target_qubits:
            self.circuit.z(qubit)

    def _add_cnot_gate(self, target_qubits, control_qubits, params):
        for control, target in zip(control_qubits, target_qubits):
            self.circuit.cx(control, target)

    def _add_rx_gate(self, target_qubits, control_qubits, params):
        angle = params[0] if params else 0.0
        for qubit in target_qubits:
            self.circuit.rx(angle, qubit)

    def _add_ry_gate(self, target_qubits, control_qubits, params):
        angle = params[0] if params else 0.0
        for qubit in target_qubits:
            self.circuit.ry(angle, qubit)

    def _add_rz_gate(self, target_qubits, control_qubits, params):
        angle = params[0] if params else 0.0
        for qubit in target_qubits:
            self.circuit.rz(angle, qubit)

    def add_measurement(self, qubits: Optional[List[int]] = None) -> None:
        """Add measurement to specified qubits or all qubits if none specified."""
        if qubits is None:
            self.circuit.measure_all()
        else:
            for qubit in qubits:
                self.circuit.measure(qubit, qubit)

    def get_state(self) -> np.ndarray:
        """Get the quantum state vector."""
        statevector = Statevector.from_instruction(self.circuit)
        return statevector.data

    def get_unitary(self) -> np.ndarray:
        """Get the unitary matrix representation of the circuit."""
        operator = Operator.from_circuit(self.circuit)
        return operator.data

    def add_parameter(self, name: str) -> Parameter:
        """Add a parameter to the circuit."""
        param = Parameter(name)
        self._parameters.append(param)
        return param

    def bind_parameters(self, values: List[float]) -> None:
        """Bind values to circuit parameters."""
        if len(values) != len(self._parameters):
            raise ValueError("Number of values does not match number of parameters")
        parameter_dict = dict(zip(self._parameters, values))
        self.circuit = self.circuit.bind_parameters(parameter_dict)

    def reset(self) -> None:
        """Reset the circuit to initial state."""
        self.circuit = QiskitCircuit(self.num_qubits)
        self._parameters = []

    def compose(self, other: "QuantumCircuit") -> None:
        """Compose this circuit with another circuit."""
        self.circuit = self.circuit.compose(other.circuit)

    def inverse(self) -> "QuantumCircuit":
        """Create inverse of this circuit."""
        inverse_circuit = QuantumCircuit(self.num_qubits)
        inverse_circuit.circuit = self.circuit.inverse()
        return inverse_circuit

    def to_matrix(self) -> np.ndarray:
        """Convert circuit to matrix representation."""
        return Operator.from_circuit(self.circuit).data

    def __str__(self) -> str:
        """String representation of the circuit."""
        return str(self.circuit)

    def optimize(self) -> None:
        # Perform circuit optimization
        self._remove_redundant_gates()
        self._merge_adjacent_gates()
        self._update_stats()

    def _remove_redundant_gates(self) -> None:
        # Identify and remove redundant gates
        current_layer: Set[Any] = set()
        for instruction in self.circuit.data:
            gate = instruction[0]
            qubits = instruction[1]
            if self._are_gates_cancellable(current_layer, gate, qubits):
                current_layer.remove(gate)
            else:
                current_layer.add(gate)

    def _merge_adjacent_gates(self) -> None:
        # Merge adjacent gates when possible
        current_layer: Set[Any] = set()
        next_layer: FrozenSet[Any] = frozenset()

        for instruction in self.circuit.data:
            gate = instruction[0]
            instruction[1]

            if self._can_merge_gates(current_layer, gate):
                self._merge_gates(current_layer, gate)
            else:
                next_layer = frozenset([gate])
                current_layer = set(next_layer)

    def _are_gates_cancellable(
        self, layer: Set[Any], gate: Any, qubits: List[int]
    ) -> bool:
        # Check if gates cancel each other
        return False  # Placeholder implementation

    def _can_merge_gates(self, layer: Set[Any], gate: Any) -> bool:
        """Check if a gate can be merged with gates in the current layer.

        Args:
            layer: Set of gates in current layer
            gate: Gate to check for merging

        Returns:
            bool: True if gate can be merged, False otherwise
        """
        if not layer:
            return False

        for existing_gate in layer:
            # Check for overlapping qubits
            if set(gate.target_qubits).intersection(existing_gate.target_qubits):
                return False

            # Check if gates are compatible for merging
            if gate.name == existing_gate.name and len(gate.target_qubits) == len(
                existing_gate.target_qubits
            ):
                return True

        return False

    def _merge_gates(self, layer: Set[Any], gate: Any) -> None:
        """Merge compatible gates in a layer.

        Args:
            layer: Set of gates to merge
            gate: Gate to merge with layer
        """
        merged = False
        for existing_gate in layer:
            if gate.name == existing_gate.name and len(gate.target_qubits) == len(
                existing_gate.target_qubits
            ):
                # Combine target qubits and control qubits
                existing_gate.target_qubits.extend(gate.target_qubits)
                if gate.control_qubits:
                    existing_gate.control_qubits.extend(gate.control_qubits)
                merged = True
                break

        if not merged:
            layer.add(gate)

    def get_metrics(self) -> Dict[str, float]:
        return {
            "gate_count": float(self.stats["gate_count"]),
            "circuit_depth": float(self.stats["depth"]),
            "error_rate": float(self.stats["error_rate"]),
            "qubit_count": float(self.num_qubits),
        }

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
                [[1, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 0], [0, 0, 0, 1]]
            ),  # SWAP
        }

    def add_custom_gate(
        self,
        name: str,
        matrix: np.ndarray,
        target_qubits: List[int],
        control_qubits: Optional[List[int]] = None,
    ) -> None:
        """Add a custom quantum gate to the circuit.

        Args:
            name: Name of the custom gate
            matrix: Unitary matrix representing the gate operation
            target_qubits: List of target qubit indices
            control_qubits: Optional list of control qubit indices

        Raises:
            ValueError: If matrix dimensions don't match qubit count or "
            "matrix isn't unitary
        """
        # Validate matrix dimensions
        expected_dim = 2 ** len(target_qubits)
        if matrix.shape != (expected_dim, expected_dim):
            raise ValueError(
                f"Matrix dimensions {matrix.shape} don't match qubit count "
                f"{len(target_qubits)}"
            )

        # Check if matrix is unitary
        if not np.allclose(matrix @ matrix.conj().T, np.eye(expected_dim)):
            raise ValueError("Gate matrix must be unitary")

        # Validate qubit indices
        all_qubits = target_qubits + (control_qubits or [])
        if not all(0 <= q < self.num_qubits for q in all_qubits):
            raise ValueError("Invalid qubit indices")

        gate = QuantumGate(name, matrix, target_qubits, control_qubits)
        self.circuit.append(
            gate.matrix, qubits=target_qubits, control_qubits=control_qubits
        )
        self._update_stats()

    def apply_gate(self, gate: QuantumGate) -> None:
        """Apply a quantum gate to the state."""
        try:
            # Expand gate to full system size
            full_matrix = self._expand_gate_matrix(gate)

            # Apply gate to state
            self.circuit.append(
                full_matrix,
                qubits=gate.target_qubits,
                control_qubits=gate.control_qubits,
            )

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

    def get_measurement_statistics(self, qubit_index: int) -> Dict[int, float]:
        """Get measurement statistics for a specific qubit.

        Args:
            qubit_index: Index of the qubit to measure

        Returns:
            Dictionary mapping measurement outcomes (0/1) to their probabilities

        Raises:
            ValueError: If qubit_index is invalid
        """
        if not 0 <= qubit_index < self.num_qubits:
            raise ValueError(f"Invalid qubit index {qubit_index}")

        # Get statevector from circuit
        from qiskit.quantum_info import Statevector

        statevector = Statevector.from_instruction(self.circuit)

        # Calculate measurement probabilities
        prob_0 = 0.0
        prob_1 = 0.0

        for i, amplitude in enumerate(statevector):
            # Convert index to binary and get qubit state
            binary = format(i, f"0{self.num_qubits}b")
            if binary[qubit_index] == "0":
                prob_0 += abs(amplitude) ** 2
            else:
                prob_1 += abs(amplitude) ** 2

        return {0: prob_0, 1: prob_1}

    @property
    def size(self) -> int:
        """Get number of qubits in circuit."""
        return self.circuit.num_qubits

    @property
    def depth(self) -> int:
        """Get circuit depth."""
        return self.circuit.depth()
