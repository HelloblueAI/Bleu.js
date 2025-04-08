"""
Quantum State Management Module
Copyright (c) 2024, Bleu.js
"""

import logging
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import numpy as np
from scipy.linalg import expm
from scipy.sparse import csr_matrix

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
        """Initialize enhanced entanglement tracking."""
        size = 2**self.num_qubits
        entanglement = np.zeros((size, size), dtype=np.complex128)

        # Initialize with controlled entanglement
        for i in range(self.num_qubits):
            for j in range(i + 1, self.num_qubits):
                # Create controlled entanglement between qubits
                entanglement[i, j] = 0.5 * (1 + 1j)  # Complex phase
                entanglement[j, i] = np.conj(entanglement[i, j])

        return entanglement

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

    def measure(self) -> Tuple[int, float]:
        """Measure specified qubits and collapse the state.

        Returns:
            Tuple of (measured state, probability)
        """
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
        rho = self.get_reduced_density_matrix(subsystem_qubits)
        eigenvalues = np.linalg.eigvalsh(rho)
        return -np.sum(eigenvalues * np.log2(eigenvalues + 1e-10))

    def apply_noise(self, error_rate: float = 0.01) -> None:
        """Apply random noise to the quantum state."""
        rng = np.random.default_rng(seed=42)  # Fixed seed for reproducibility

        # Apply random phase errors
        for i in range(self.num_qubits):
            if rng.random() < error_rate:
                phase = rng.random() * 2 * np.pi
                self._apply_phase_error(i, phase)

    def measure_all(self):
        """Measure all qubits in the computational basis."""
        rng = np.random.default_rng(seed=42)  # Fixed seed for reproducibility
        results = {}

        # Calculate measurement probabilities
        probabilities = np.abs(self.state) ** 2

        # Perform measurements
        for i in range(self.num_qubits):
            outcome = 1 if rng.random() < probabilities[i] else 0
            results[i] = outcome
            self._collapse_state(i, outcome)

        return results

    def _collapse_state(self, qubit_idx, outcome):
        """Collapse the state after measurement."""
        # Project and normalize the state
        projection = self._get_projection_operator(qubit_idx, outcome)
        self.state = projection @ self.state
        self.state /= np.linalg.norm(self.state)

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

    def _update_entanglement(self, target_qubits: List[int]) -> None:
        """Update entanglement map after gate application."""
        # Update entanglement between target qubits
        for i in target_qubits:
            for j in range(self.num_qubits):
                if j not in target_qubits:
                    # Calculate new entanglement
                    new_entanglement = self._calculate_entanglement(i, j)
                    self.entanglement[i, j] = new_entanglement
                    self.entanglement[j, i] = np.conj(new_entanglement)

    def _calculate_entanglement(self, qubit1: int, qubit2: int) -> complex:
        """Calculate entanglement between two qubits."""
        # Get reduced density matrix for the two qubits
        rho = self.get_reduced_density_matrix(
            [i for i in range(self.num_qubits) if i not in [qubit1, qubit2]]
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

        return concurrence * np.exp(1j * np.angle(self.entanglement[qubit1, qubit2]))

    def get_entanglement_map(self) -> Dict[Tuple[int, int], float]:
        """Get current entanglement map with normalized values."""
        entanglement_map = {}
        for i in range(self.num_qubits):
            for j in range(i + 1, self.num_qubits):
                # Normalize entanglement value
                norm = np.abs(self.entanglement[i, j])
                entanglement_map[(i, j)] = norm
        return entanglement_map


from functools import reduce  # For _expand_gate method
