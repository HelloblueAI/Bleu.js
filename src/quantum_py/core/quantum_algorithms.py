from typing import List, Optional, Tuple

import numpy as np

from ..utils.quantum_utils import (
    create_controlled_unitary,
    create_grover_operator,
    create_phase_estimation_circuit,
    quantum_fourier_transform,
)
from .quantum_circuit import QuantumCircuit
from .quantum_processor import QuantumProcessor


class QuantumAlgorithms:
    """Implementation of quantum algorithms."""

    def __init__(self, processor: QuantumProcessor):
        """Initialize quantum algorithms.

        Args:
            processor: Quantum processor to execute algorithms
        """
        self.processor = processor

    def quantum_phase_estimation(
        self, unitary: np.ndarray, precision_qubits: int, num_iterations: int = 100
    ) -> float:
        """Perform quantum phase estimation.

        Args:
            unitary: Unitary operator to estimate phase of
            precision_qubits: Number of qubits for precision
            num_iterations: Number of iterations for statistical convergence

        Returns:
            Estimated phase
        """
        # Create phase estimation circuit
        circuit, control_qubits = create_phase_estimation_circuit(
            unitary, precision_qubits
        )

        # Initialize quantum register
        total_qubits = precision_qubits + int(np.log2(len(unitary)))
        qpe_circuit = QuantumCircuit(total_qubits)

        # Apply Hadamard gates to control qubits
        for qubit in control_qubits:
            qpe_circuit.add_gate("H", [qubit])

        # Apply controlled-U operations
        for i, control in enumerate(control_qubits):
            power = 2**i
            U_power = np.linalg.matrix_power(unitary, power)
            controlled_U = create_controlled_unitary(U_power)
            qpe_circuit.add_gate("CUSTOM", [control], matrix=controlled_U)

        # Apply inverse QFT to control qubits
        qft_inv = np.conj(quantum_fourier_transform(precision_qubits)).T
        qpe_circuit.add_gate("CUSTOM", control_qubits, matrix=qft_inv)

        # Run circuit multiple times and collect statistics
        phases = []
        for _ in range(num_iterations):
            final_state = self.processor.apply_circuit(qpe_circuit)
            # Measure control qubits
            measurements = qpe_circuit.measure(control_qubits)
            # Convert measurements to phase
            phase = sum(m * 2 ** (-i - 1) for i, m in enumerate(measurements))
            phases.append(phase)

        # Return average phase
        return np.mean(phases)

    def grover_search(
        self,
        oracle: np.ndarray,
        num_qubits: int,
        marked_states: List[int],
        num_iterations: Optional[int] = None,
    ) -> List[int]:
        """Perform Grover's search algorithm.

        Args:
            oracle: Oracle matrix marking target states
            num_qubits: Number of qubits
            marked_states: List of marked state indices
            num_iterations: Optional number of iterations (auto-calculated if None)

        Returns:
            List of found marked states
        """
        N = 2**num_qubits
        M = len(marked_states)

        # Calculate optimal number of iterations
        if num_iterations is None:
            num_iterations = int(np.pi / 4 * np.sqrt(N / M))

        # Create Grover operator
        G = create_grover_operator(marked_states, num_qubits)

        # Create circuit
        circuit = QuantumCircuit(num_qubits)

        # Initialize uniform superposition
        for i in range(num_qubits):
            circuit.add_gate("H", [i])

        # Apply Grover iterations
        for _ in range(num_iterations):
            # Apply oracle
            circuit.add_gate("CUSTOM", list(range(num_qubits)), matrix=oracle)
            # Apply diffusion operator
            circuit.add_gate("CUSTOM", list(range(num_qubits)), matrix=G)

        # Run circuit and measure
        final_state = self.processor.apply_circuit(circuit)
        measurements = circuit.measure(list(range(num_qubits)))

        # Return states with high probability
        threshold = 1 / (2 * np.sqrt(N))
        return [i for i, p in enumerate(np.abs(final_state) ** 2) if p > threshold]

    def quantum_fourier_transform_circuit(
        self, num_qubits: int, inverse: bool = False
    ) -> QuantumCircuit:
        """Create quantum Fourier transform circuit.

        Args:
            num_qubits: Number of qubits
            inverse: Whether to create inverse QFT

        Returns:
            QFT circuit
        """
        circuit = QuantumCircuit(num_qubits)

        def qft_rotations(q: int):
            """Apply QFT rotations to qubit q."""
            for i in range(q):
                circuit.add_gate("CP", [q, i], phase=2 * np.pi / 2 ** (q - i))
            circuit.add_gate("H", [q])

        def swap_qubits():
            """Swap qubits for bit reversal."""
            for i in range(num_qubits // 2):
                circuit.add_gate("SWAP", [i, num_qubits - 1 - i])

        if not inverse:
            for q in range(num_qubits):
                qft_rotations(q)
            swap_qubits()
        else:
            swap_qubits()
            for q in range(num_qubits - 1, -1, -1):
                qft_rotations(q)

        return circuit

    def quantum_counting(
        self, oracle: np.ndarray, num_qubits: int, precision_qubits: int
    ) -> Tuple[int, float]:
        """Perform quantum counting algorithm.

        Args:
            oracle: Oracle matrix marking target states
            num_qubits: Number of qubits for search space
            precision_qubits: Number of qubits for precision

        Returns:
            Tuple of (estimated count, confidence)
        """
        # Create Grover operator
        G = create_grover_operator([], num_qubits)  # Empty marked_states for now

        # Create quantum counting circuit
        total_qubits = precision_qubits + num_qubits
        circuit = QuantumCircuit(total_qubits)

        # Initialize counting qubits
        for i in range(precision_qubits):
            circuit.add_gate("H", [i])

        # Initialize search space
        for i in range(precision_qubits, total_qubits):
            circuit.add_gate("H", [i])

        # Apply controlled Grover iterations
        for i in range(precision_qubits):
            power = 2**i
            for _ in range(power):
                circuit.add_gate(
                    "CUSTOM", list(range(num_qubits)), matrix=oracle, control_qubits=[i]
                )
                circuit.add_gate(
                    "CUSTOM", list(range(num_qubits)), matrix=G, control_qubits=[i]
                )

        # Apply inverse QFT to counting qubits
        qft_circuit = self.quantum_fourier_transform_circuit(
            precision_qubits, inverse=True
        )
        circuit.gates.extend(qft_circuit.gates)

        # Run circuit
        final_state = self.processor.apply_circuit(circuit)

        # Measure counting qubits
        measurements = circuit.measure(list(range(precision_qubits)))

        # Calculate number of solutions and confidence
        theta = 2 * np.pi * sum(m * 2 ** (-i - 1) for i, m in enumerate(measurements))
        M = int(2**num_qubits * np.sin(theta / 2) ** 2)
        confidence = np.abs(final_state[measurements]) ** 2

        return M, float(confidence)

    def quantum_teleportation(self, state: np.ndarray) -> np.ndarray:
        """Perform quantum teleportation protocol.

        Args:
            state: Quantum state to teleport

        Returns:
            Teleported state
        """
        if len(state) != 2:
            raise ValueError("Can only teleport single-qubit states")

        # Create 3-qubit circuit (sender, auxiliary, receiver)
        circuit = QuantumCircuit(3)

        # Initialize state to teleport
        circuit.state.amplitudes[:2] = state

        # Create Bell pair between auxiliary and receiver
        circuit.add_gate("H", [1])
        circuit.add_gate("CNOT", [2], [1])

        # Perform Bell measurement on sender and auxiliary
        circuit.add_gate("CNOT", [1], [0])
        circuit.add_gate("H", [0])

        # Measure sender and auxiliary qubits
        measurements = circuit.measure([0, 1])

        # Apply corrections to receiver based on measurements
        if measurements[0] == 1:
            circuit.add_gate("Z", [2])
        if measurements[1] == 1:
            circuit.add_gate("X", [2])

        # Run circuit
        final_state = self.processor.apply_circuit(circuit)

        # Extract receiver's state
        receiver_state = final_state.reshape(2, 2, 2)[0, 0, :]
        return receiver_state / np.linalg.norm(receiver_state)

    def quantum_error_correction(
        self, state: np.ndarray, error_rate: float
    ) -> np.ndarray:
        """Perform quantum error correction using Shor's 9-qubit code.

        Args:
            state: Single-qubit state to protect
            error_rate: Probability of errors

        Returns:
            Error-corrected state
        """
        if len(state) != 2:
            raise ValueError("Can only protect single-qubit states")

        # Create 9-qubit circuit
        circuit = QuantumCircuit(9)

        # Encode logical state
        # |ψ⟩ → |ψ⟩⊗(|000⟩ + |111⟩)⊗3/√8
        circuit.state.amplitudes[:2] = state

        for i in range(0, 9, 3):
            # Create GHZ-like state for each block
            circuit.add_gate("H", [i])
            circuit.add_gate("CNOT", [i + 1], [i])
            circuit.add_gate("CNOT", [i + 2], [i])

        # Simulate errors
        for i in range(9):
            if np.random.random() < error_rate:
                # Apply random Pauli error
                error = np.random.choice(["X", "Y", "Z"])
                circuit.add_gate(error, [i])

        # Perform error correction
        # Measure stabilizers
        stabilizers = [
            ([0, 1, 2], "Z"),  # Phase errors
            ([3, 4, 5], "Z"),
            ([6, 7, 8], "Z"),
            ([0, 3, 6], "X"),  # Bit-flip errors
            ([1, 4, 7], "X"),
            ([2, 5, 8], "X"),
        ]

        for qubits, basis in stabilizers:
            # Measure stabilizer
            if basis == "Z":
                measurements = circuit.measure(qubits)
                # Apply corrections
                if sum(measurements.values()) % 2 == 1:
                    circuit.add_gate("X", [qubits[0]])
            else:  # X basis
                # Transform to Z basis
                for q in qubits:
                    circuit.add_gate("H", [q])
                measurements = circuit.measure(qubits)
                # Apply corrections
                if sum(measurements.values()) % 2 == 1:
                    circuit.add_gate("Z", [qubits[0]])
                # Transform back
                for q in qubits:
                    circuit.add_gate("H", [q])

        # Run circuit
        final_state = self.processor.apply_circuit(circuit)

        # Decode and extract corrected state
        logical_state = final_state.reshape([2] * 9)[0, 0, 0, 0, 0, 0, 0, 0, :]
        return logical_state / np.linalg.norm(logical_state)
