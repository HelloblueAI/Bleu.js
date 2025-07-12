"""
Quantum State Management Module
Copyright (c) 2024, Bleu.js
"""

import logging
from dataclasses import dataclass
from functools import reduce  # For _expand_gate method
from typing import Dict, List, Optional, Tuple

import numpy as np
from numpy.typing import NDArray
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector

logger = logging.getLogger(__name__)


@dataclass
class Complex:
    real: float
    imag: float

    def __mul__(self, other: "Complex") -> "Complex":
        return Complex(
            self.real * other.real - self.imag * other.imag,
            self.real * other.imag + self.imag * other.real,
        )

    def __add__(self, other: "Complex") -> "Complex":
        return Complex(self.real + other.real, self.imag + other.imag)


class QuantumState:
    """Enhanced quantum state implementation using NumPy for better performance."""

    _CIRCUIT_NOT_INITIALIZED_ERROR = "Circuit not initialized"

    def __init__(self, n_qubits: int, seed: Optional[int] = None) -> None:
        """Initialize a quantum state with the specified number of qubits.

        Args:
            n_qubits: Number of qubits in the system (must be positive and <= 32)
            seed: Random seed for reproducibility
        """
        if not isinstance(n_qubits, int) or n_qubits <= 0 or n_qubits > 32:
            raise ValueError(
                "Number of qubits must be a positive integer less than or equal to 32"
            )

        self.n_qubits = n_qubits
        self.amplitudes: NDArray[np.complex128] = np.zeros(
            2**n_qubits, dtype=np.complex128
        )
        self.amplitudes[0] = 1.0  # Initialize to |0...0⟩ state
        self._entanglement_map: Dict[int, List[int]] = {}
        self.circuit: Optional[QuantumCircuit] = None
        self._initialize_state()

        self.rng = np.random.default_rng(seed)

        # Enhanced features
        self._coherence_times = np.ones(n_qubits)
        self._last_operation_time = np.zeros(n_qubits)
        self.error_rates = self._initialize_error_rates()

    @property
    def state_vector(self) -> np.ndarray:
        """Get the quantum state vector."""
        return self.amplitudes

    def _initialize_state(self) -> None:
        self.circuit = QuantumCircuit(self.n_qubits)
        self._update_entanglement_map()

    def _update_entanglement_map(self) -> None:
        for i in range(self.n_qubits):
            self._entanglement_map[i] = []

    def get_state_vector(self) -> NDArray[np.complex128]:
        if self.circuit is None:
            raise RuntimeError(self._CIRCUIT_NOT_INITIALIZED_ERROR)
        return Statevector.from_instruction(self.circuit).data

    def get_probabilities(self) -> NDArray[np.float64]:
        state_vector = self.get_state_vector()
        return np.abs(state_vector) ** 2

    def get_fidelity(self, target_state: "QuantumState") -> float:
        state1 = self.get_state_vector()
        state2 = target_state.get_state_vector()
        return float(np.abs(np.vdot(state1, state2)) ** 2)

    def measure(self, qubits: List[int]) -> int:
        if self.circuit is None:
            raise RuntimeError(self._CIRCUIT_NOT_INITIALIZED_ERROR)
        probs = self.get_probabilities()
        outcome = self.rng.choice(2**self.n_qubits, p=probs)
        result = 0
        for i, qubit in enumerate(qubits):
            result |= ((outcome >> qubit) & 1) << i
        return result

    def get_density_matrix(self) -> NDArray[np.complex128]:
        state = self.get_state_vector()
        return np.outer(state, np.conj(state))

    def get_reduced_density_matrix(self, qubits: List[int]) -> NDArray[np.complex128]:
        rho = self.get_density_matrix()
        n_qubits = len(qubits)
        dim = 2**n_qubits
        reduced_rho = np.zeros((dim, dim), dtype=np.complex128)

        # Perform partial trace
        for i in range(dim):
            for j in range(dim):
                reduced_rho[i, j] = self._partial_trace_element(rho, qubits, i, j)

        return reduced_rho

    def _partial_trace_element(
        self, rho: NDArray[np.complex128], qubits: List[int], i: int, j: int
    ) -> complex:
        trace = 0.0
        n_total = self.n_qubits
        for k in range(2 ** (n_total - len(qubits))):
            idx1 = self._combine_indices(i, k, qubits)
            idx2 = self._combine_indices(j, k, qubits)
            trace += rho[idx1, idx2]
        return complex(trace)

    def _combine_indices(
        self, kept_idx: int, traced_idx: int, kept_qubits: List[int]
    ) -> int:
        result = 0
        traced_bit_pos = 0
        kept_bit_pos = 0

        for i in range(self.n_qubits):
            if i in kept_qubits:
                bit = (kept_idx >> kept_bit_pos) & 1
                kept_bit_pos += 1
            else:
                bit = (traced_idx >> traced_bit_pos) & 1
                traced_bit_pos += 1
            result |= bit << i

        return result

    def get_entanglement_entropy(self, qubits: List[int]) -> float:
        rho = self.get_reduced_density_matrix(qubits)
        eigenvalues = np.linalg.eigvalsh(rho)
        # Remove near-zero eigenvalues to avoid log(0)
        eigenvalues = eigenvalues[eigenvalues > 1e-10]
        return float(-np.sum(eigenvalues * np.log2(eigenvalues)))

    def get_purity(self) -> float:
        rho = self.get_density_matrix()
        return float(np.trace(rho @ rho).real)

    def get_concurrence(self, qubit1: int, qubit2: int) -> float:
        if self.n_qubits < 2:
            raise ValueError("Concurrence requires at least 2 qubits")

        rho = self.get_reduced_density_matrix([qubit1, qubit2])
        sigma_y = np.array([[0, -1j], [1j, 0]], dtype=np.complex128)
        rho_tilde = (sigma_y @ np.conj(rho) @ sigma_y).reshape(2, 2)
        R = rho @ rho_tilde
        eigenvalues = np.sqrt(np.linalg.eigvals(R))
        eigenvalues = np.sort(np.abs(eigenvalues))[::-1]
        return float(
            max(0.0, eigenvalues[0] - eigenvalues[1] - eigenvalues[2] - eigenvalues[3])
        )

    def apply_gate(
        self, gate_matrix: NDArray[np.complex128], target_qubits: List[int]
    ) -> None:
        """Apply a quantum gate to the state.

        Args:
            gate_matrix: Unitary matrix representing the quantum gate
            target_qubits: List of target qubit indices
        """
        if self.circuit is None:
            raise RuntimeError(self._CIRCUIT_NOT_INITIALIZED_ERROR)

        # Validate gate matrix dimensions
        n_qubits = len(target_qubits)
        expected_size = 2**n_qubits
        if gate_matrix.shape != (expected_size, expected_size):
            raise ValueError(f"Invalid gate matrix dimensions for {n_qubits} qubits")

        # Apply gate to circuit
        self.circuit.unitary(gate_matrix, target_qubits)
        self._update_entanglement(target_qubits)

    def measure_all(self):
        """Measure all qubits in the computational basis."""
        results = {}

        # Calculate measurement probabilities
        probabilities = np.abs(self.amplitudes) ** 2

        # Perform measurements
        for i in range(self.n_qubits):
            outcome = 1 if self.rng.random() < probabilities[i] else 0
            results[i] = outcome
            self._collapse_state(i, outcome)

        return results

    def _collapse_state(self, qubit_idx, outcome):
        """Collapse the state after measurement."""
        # Project and normalize the state
        projection = self._get_projection_operator(qubit_idx, outcome)
        self.amplitudes = projection @ self.amplitudes
        self.amplitudes /= np.linalg.norm(self.amplitudes)

    def _validate_gate(self, gate_matrix: np.ndarray, num_target_qubits: int) -> bool:
        """Validate that a gate matrix is unitary and has correct dimensions."""
        expected_size = 2**num_target_qubits
        if gate_matrix.shape != (expected_size, expected_size):
            return False
        # Check if gate is unitary (U†U = I)
        identity = np.eye(expected_size)
        return np.allclose(gate_matrix @ gate_matrix.conj().T, identity)

    def _expand_gate(
        self, gate_matrix: np.ndarray, target_qubits: List[int]
    ) -> np.ndarray:
        """Expand a gate matrix to operate on the full Hilbert space."""
        n = self.n_qubits
        if len(target_qubits) == n:
            return gate_matrix

        # Create the full operation matrix using tensor products
        ops = []
        for i in range(n):
            if i in target_qubits:
                idx = target_qubits.index(i)
                op = gate_matrix.reshape([2] * (2 * len(target_qubits)))[..., idx]
            else:
                op = np.eye(2)
            ops.append(op)

        return reduce(np.kron, ops)

    def _update_coherence(self, target_qubits: List[int]) -> None:
        """Enhanced coherence time tracking."""
        current_time = self.rng.random()  # Simulate time progression

        for qubit in target_qubits:
            # Calculate time since last operation
            time_diff = current_time - self._last_operation_time[qubit]

            # Update coherence time with improved model
            t2 = self._coherence_times[qubit]
            t2_new = t2 * np.exp(-time_diff / (20.0 * (1 + self.error_rates[qubit])))

            # Update error rates based on coherence
            self.error_rates[qubit] = 1.0 - (t2_new / t2)
            self._coherence_times[qubit] = t2_new
            self._last_operation_time[qubit] = current_time

    def _apply_noise(self, error_rate: float = 0.01) -> None:
        """Apply random noise to the quantum state."""
        # Apply random phase errors
        for i in range(self.n_qubits):
            if self.rng.random() < error_rate:
                phase = self.rng.random() * 2 * np.pi
                self._apply_phase_error(i, phase)

    def _apply_phase_error(self, qubit: int, angle: float) -> None:
        if self.circuit is None:
            raise RuntimeError(self._CIRCUIT_NOT_INITIALIZED_ERROR)
        self.circuit.rz(angle, qubit)

    def get_entanglement_map(self) -> Dict[Tuple[int, int], float]:
        """Get current entanglement map with normalized values."""
        entanglement_map = {}
        for i in range(self.n_qubits):
            for j in range(i + 1, self.n_qubits):
                # Normalize entanglement value
                norm = np.abs(self.amplitudes[i] * self.amplitudes[j])
                entanglement_map[(i, j)] = norm
        return entanglement_map

    def _get_projection_operator(
        self, qubit_idx: int, outcome: int
    ) -> NDArray[np.complex128]:
        """Create projection operator for measurement on specified qubit."""
        dim = 2**self.n_qubits
        projector = np.zeros((dim, dim), dtype=np.complex128)
        mask = 1 << qubit_idx
        for i in range(dim):
            if (i & mask) >> qubit_idx == outcome:
                projector[i, i] = 1.0
        return projector

    def _update_entanglement(self, target_qubits: List[int]) -> None:
        """Update entanglement map after gate application."""
        # Update entanglement between target qubits
        for i in target_qubits:
            for j in range(self.n_qubits):
                if j not in target_qubits:
                    # Calculate new entanglement
                    new_entanglement = self._calculate_entanglement(i, j)
                    self.amplitudes[i] *= new_entanglement
                    self.amplitudes[j] *= np.conj(new_entanglement)

    def _calculate_entanglement(self, qubit1: int, qubit2: int) -> complex:
        """Calculate entanglement between two qubits."""
        # Get reduced density matrix for the two qubits
        rho = self.get_reduced_density_matrix(
            [i for i in range(self.n_qubits) if i not in [qubit1, qubit2]]
        )

        # Calculate concurrence as measure of entanglement
        rho_tilde = (
            np.kron(np.array([[0, 1], [-1, 0]]), np.array([[0, 1], [-1, 0]]))
            @ rho.conj()
            @ np.kron(np.array([[0, 1], [-1, 0]]), np.array([[0, 1], [-1, 0]]))
        )

        eigenvalues = np.linalg.eigvals(rho @ rho_tilde)
        eigenvalues = np.sqrt(np.maximum(eigenvalues, 0))

        # Calculate concurrence
        concurrence = max(
            0, eigenvalues[0] - eigenvalues[1] - eigenvalues[2] - eigenvalues[3]
        )

        return concurrence * np.exp(
            1j * np.angle(self.amplitudes[qubit1] * self.amplitudes[qubit2])
        )

    def _initialize_error_rates(self) -> NDArray[np.float64]:
        """Initialize error rates for each qubit."""
        return self.rng.random(self.n_qubits) * 0.01

    def __str__(self) -> str:
        """String representation of the quantum state."""
        return f"QuantumState(num_qubits={self.n_qubits}, state=\n{self.amplitudes})"

    def _apply_noise_to_state(self, state: np.ndarray) -> np.ndarray:
        """Apply noise to quantum state."""
        noise = self.rng.normal(0, 0.1, state.shape)
        return state + noise

    def _apply_quantum_gate(self, state: np.ndarray, gate: np.ndarray) -> np.ndarray:
        """Apply a quantum gate to the state."""
        return np.dot(gate, state)

    def _apply_quantum_circuit(self, state: np.ndarray) -> np.ndarray:
        """Apply a quantum circuit to the state."""
        if self.circuit is None:
            return state
        for gate in self.circuit:
            state = self._apply_quantum_gate(state, gate)
        return state
