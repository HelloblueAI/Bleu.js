import logging
from dataclasses import dataclass
from typing import List, Optional, Tuple

import numpy as np

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

    def __init__(self, num_qubits: int, seed: Optional[int] = None):
        """Initialize a quantum state with the specified number of qubits.

        Args:
            num_qubits: Number of qubits in the system (must be positive and <= 32)
            seed: Random seed for reproducibility
        """
        if not isinstance(num_qubits, int) or num_qubits <= 0 or num_qubits > 32:
            raise ValueError(
                "Number of qubits must be a positive integer less than or equal to 32"
            )

        self.num_qubits = num_qubits
        self.dimension = 2**num_qubits
        self.rng = np.random.default_rng(seed)
        self.state = self._initialize_state()
        self.entanglement = self._initialize_entanglement()
        self.error_rates = self._initialize_error_rates()

        # Enhanced features
        self._entanglement_map = {}
        self._coherence_times = np.ones(num_qubits)
        self._last_operation_time = np.zeros(num_qubits)

    @property
    def state_vector(self) -> np.ndarray:
        """Get the quantum state vector."""
        return self.state.flatten()

    def _initialize_state(self) -> np.ndarray:
        """Initialize quantum state vector."""
        size = 2**self.num_qubits
        state = self.rng.random(size) + 1j * self.rng.random(size)
        return state / np.linalg.norm(state)

    def _initialize_entanglement(self) -> np.ndarray:
        """Initialize entanglement matrix."""
        size = 2**self.num_qubits
        return self.rng.random((size, size)) + 1j * self.rng.random((size, size))

    def _initialize_error_rates(self) -> np.ndarray:
        """Initialize error rates for each qubit."""
        return self.rng.random(self.num_qubits) * 0.01

    def apply_gate(self, gate_matrix: np.ndarray, target_qubits: List[int]) -> None:
        """Apply a quantum gate to the state.

        Args:
            gate_matrix: Unitary matrix representing the quantum gate
            target_qubits: List of target qubit indices
        """
        if not self._validate_gate(gate_matrix, len(target_qubits)):
            raise ValueError("Invalid gate matrix or target qubits")

        # Calculate the full operation matrix
        operation = self._expand_gate(gate_matrix, target_qubits)

        # Apply the operation
        self.state = operation @ self.state

        # Update coherence and error tracking
        self._update_coherence(target_qubits)

    def measure(self, qubit_indices: Optional[List[int]] = None) -> Tuple[int, float]:
        """Measure specified qubits and collapse the state.

        Args:
            qubit_indices: List of qubit indices to measure. If None, measure all qubits.

        Returns:
            Tuple of (measured state, probability)
        """
        if qubit_indices is None:
            qubit_indices = list(range(self.num_qubits))

        # Calculate probabilities
        probs = np.abs(self.state) ** 2

        # Choose outcome based on probabilities
        outcome = self.rng.choice(self.dimension, p=probs)

        # Collapse state
        self.state = np.zeros_like(self.state)
        self.state[outcome] = 1.0

        return outcome, probs[outcome]

    def get_density_matrix(self) -> np.ndarray:
        """Calculate the density matrix representation of the state."""
        return np.outer(self.state, np.conj(self.state))

    def get_reduced_density_matrix(self, traced_out_qubits: List[int]) -> np.ndarray:
        """Calculate the reduced density matrix by tracing out specified qubits."""
        rho = self.get_density_matrix()
        for qubit in sorted(traced_out_qubits, reverse=True):
            rho = self._partial_trace(rho, qubit)
        return rho

    def get_entanglement_entropy(self, subsystem_qubits: List[int]) -> float:
        """Calculate the von Neumann entropy of the reduced density matrix."""
        rho_reduced = self.get_reduced_density_matrix(
            [q for q in range(self.num_qubits) if q not in subsystem_qubits]
        )
        eigenvalues = np.linalg.eigvalsh(rho_reduced)
        eigenvalues = eigenvalues[eigenvalues > 1e-15]  # Remove numerical noise
        return float(-np.sum(eigenvalues * np.log2(eigenvalues)))

    def apply_noise(self, error_rate: float = 0.01) -> None:
        """Apply depolarizing noise to the quantum state."""
        for i in range(self.num_qubits):
            if self.rng.random() < error_rate:
                # Apply random Pauli error
                error_gate = np.random.choice(
                    [
                        np.array([[0, 1], [1, 0]]),  # X gate
                        np.array([[0, -1j], [1j, 0]]),  # Y gate
                        np.array([[1, 0], [0, -1]]),  # Z gate
                    ]
                )
                self.apply_gate(error_gate, [i])

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
        n = self.num_qubits
        if len(target_qubits) == n:
            return gate_matrix

        # Create the full operation matrix using tensor products
        ops = []
        current_qubit = 0
        for i in range(n):
            if i in target_qubits:
                idx = target_qubits.index(i)
                dim = 2 ** (len(target_qubits) - idx - 1)
                op = gate_matrix.reshape([2] * (2 * len(target_qubits)))[..., idx]
            else:
                op = np.eye(2)
            ops.append(op)
            current_qubit += 1

        return reduce(np.kron, ops)

    def _update_coherence(self, target_qubits: List[int]) -> None:
        """Update coherence times and error rates for target qubits."""
        current_time = self.rng.random()  # Simulate time progression
        for qubit in target_qubits:
            time_diff = current_time - self._last_operation_time[qubit]
            self._coherence_times[qubit] *= np.exp(-time_diff / 20.0)  # T2 decay
            self.error_rates[qubit] = 1.0 - self._coherence_times[qubit]
            self._last_operation_time[qubit] = current_time

    def _partial_trace(self, rho: np.ndarray, qubit: int) -> np.ndarray:
        """Calculate partial trace over a single qubit."""
        n = self.num_qubits
        dims = [2] * (2 * n)
        reshaped = rho.reshape(dims)

        # Contract the indices corresponding to the traced out qubit
        traced_dims = list(range(2 * n))
        traced_dims.pop(n + qubit)
        traced_dims.pop(qubit)

        return np.trace(reshaped, axis1=qubit, axis2=n + qubit).reshape(
            2 ** (n - 1), 2 ** (n - 1)
        )

    def __str__(self) -> str:
        """String representation of the quantum state."""
        return f"QuantumState(num_qubits={self.num_qubits}, state=\n{self.state})"

    def _apply_noise(self, state: np.ndarray) -> np.ndarray:
        """Apply noise to quantum state."""
        rng = np.random.default_rng(seed=42)  # Fixed seed for reproducibility
        noise = rng.normal(0, 0.1, state.shape)
        return state + noise

    def _apply_quantum_gate(self, state: np.ndarray, gate: np.ndarray) -> np.ndarray:
        """Apply a quantum gate to the state."""
        return np.dot(gate, state)

    def _apply_quantum_circuit(self, state: np.ndarray) -> np.ndarray:
        """Apply a quantum circuit to the state."""
        for gate in self.circuit:
            state = self._apply_quantum_gate(state, gate)
        return state


from functools import reduce  # For _expand_gate method
