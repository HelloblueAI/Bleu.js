import logging
from typing import List, Tuple

import numpy as np
from scipy import linalg

logger = logging.getLogger(__name__)


def create_bell_state(which: int = 0) -> np.ndarray:
    """Create a Bell state.

    Args:
        which: Which Bell state to create (0-3)

    Returns:
        Bell state vector
    """
    if which not in range(4):
        raise ValueError("Bell state index must be 0-3")

    # Base Bell state |Φ+⟩ = (|00⟩ + |11⟩)/√2
    state = np.array([1, 0, 0, 1]) / np.sqrt(2)

    if which == 1:  # |Φ-⟩ = (|00⟩ - |11⟩)/√2
        state[3] = -1
    elif which == 2:  # |Ψ+⟩ = (|01⟩ + |10⟩)/√2
        state = np.array([0, 1, 1, 0]) / np.sqrt(2)
    elif which == 3:  # |Ψ-⟩ = (|01⟩ - |10⟩)/√2
        state = np.array([0, 1, -1, 0]) / np.sqrt(2)

    return state


def create_ghz_state(num_qubits: int) -> np.ndarray:
    """Create a GHZ state.

    Args:
        num_qubits: Number of qubits

    Returns:
        GHZ state vector
    """
    if num_qubits < 2:
        raise ValueError("GHZ state requires at least 2 qubits")

    # |GHZ⟩ = (|000...0⟩ + |111...1⟩)/√2
    size = 2**num_qubits
    state = np.zeros(size)
    state[0] = 1  # |000...0⟩
    state[-1] = 1  # |111...1⟩
    return state / np.sqrt(2)


def create_w_state(num_qubits: int) -> np.ndarray:
    """Create a W state.

    Args:
        num_qubits: Number of qubits

    Returns:
        W state vector
    """
    if num_qubits < 2:
        raise ValueError("W state requires at least 2 qubits")

    # |W⟩ = (|100...0⟩ + |010...0⟩ + ... + |000...1⟩)/√n
    size = 2**num_qubits
    state = np.zeros(size)

    # Set the appropriate amplitudes
    for i in range(num_qubits):
        idx = 2 ** (num_qubits - i - 1)
        state[idx] = 1

    return state / np.sqrt(num_qubits)


def partial_trace(
    state: np.ndarray, trace_qubits: List[int], num_qubits: int
) -> np.ndarray:
    """Calculate partial trace of quantum state.

    Args:
        state: State vector
        trace_qubits: List of qubit indices to trace out
        num_qubits: Total number of qubits

    Returns:
        Reduced density matrix
    """
    # Convert state vector to density matrix
    if state.ndim == 1:
        state = np.outer(state, state.conj())

    # Reshape to tensor product form
    shape = [2] * (2 * num_qubits)
    state = state.reshape(shape)

    # Trace out specified qubits
    keep_qubits = list(set(range(num_qubits)) - set(trace_qubits))
    axes = keep_qubits + [x + num_qubits for x in keep_qubits]
    reduced = np.trace(
        state, axis1=trace_qubits, axis2=[x + num_qubits for x in trace_qubits]
    )

    # Reshape back to matrix form
    dim = 2 ** len(keep_qubits)
    return reduced.reshape((dim, dim))


def von_neumann_entropy(state: np.ndarray) -> float:
    """Calculate von Neumann entropy of quantum state.

    Args:
        state: Density matrix or state vector

    Returns:
        von Neumann entropy
    """
    # Convert state vector to density matrix if needed
    if state.ndim == 1:
        state = np.outer(state, state.conj())

    # Calculate eigenvalues
    eigenvals = linalg.eigvalsh(state)

    # Remove near-zero eigenvalues
    eigenvals = eigenvals[eigenvals > 1e-10]

    # Calculate entropy
    return -np.sum(eigenvals * np.log2(eigenvals))


def concurrence(state: np.ndarray) -> float:
    """Calculate concurrence (entanglement measure) for two-qubit state.

    Args:
        state: Two-qubit state vector or density matrix

    Returns:
        Concurrence value
    """
    if state.ndim == 1:
        if len(state) != 4:
            raise ValueError("State must be a two-qubit state")
        state = np.outer(state, state.conj())

    # Calculate spin-flipped state
    sigma_y = np.array([[0, -1j], [1j, 0]])
    R = np.kron(sigma_y, sigma_y)
    rho_tilde = R @ state.conj() @ R

    # Calculate eigenvalues
    M = state @ rho_tilde
    eigenvals = np.sqrt(linalg.eigvalsh(M))
    eigenvals = np.sort(eigenvals)[::-1]

    # Calculate concurrence
    C = max(0, eigenvals[0] - eigenvals[1] - eigenvals[2] - eigenvals[3])
    return float(C)


def quantum_mutual_information(
    state: np.ndarray, subsys_a: List[int], subsys_b: List[int], num_qubits: int
) -> float:
    """Calculate quantum mutual information between two subsystems.

    Args:
        state: Quantum state
        subsys_a: Indices of first subsystem
        subsys_b: Indices of second subsystem
        num_qubits: Total number of qubits

    Returns:
        Quantum mutual information
    """
    # Calculate reduced density matrices
    rho_a = partial_trace(
        state, list(set(range(num_qubits)) - set(subsys_a)), num_qubits
    )
    rho_b = partial_trace(
        state, list(set(range(num_qubits)) - set(subsys_b)), num_qubits
    )
    rho_ab = partial_trace(
        state, list(set(range(num_qubits)) - set(subsys_a + subsys_b)), num_qubits
    )

    # Calculate von Neumann entropies
    S_a = von_neumann_entropy(rho_a)
    S_b = von_neumann_entropy(rho_b)
    S_ab = von_neumann_entropy(rho_ab)

    return S_a + S_b - S_ab


def fidelity(state1: np.ndarray, state2: np.ndarray) -> float:
    """Calculate fidelity between two quantum states.

    Args:
        state1: First quantum state
        state2: Second quantum state

    Returns:
        Fidelity between states
    """
    # Convert to density matrices if needed
    if state1.ndim == 1:
        state1 = np.outer(state1, state1.conj())
    if state2.ndim == 1:
        state2 = np.outer(state2, state2.conj())

    # Calculate matrix square root
    sqrt_state1 = linalg.sqrtm(state1)

    # Calculate fidelity
    M = sqrt_state1 @ state2 @ sqrt_state1
    return float(np.real(np.trace(linalg.sqrtm(M))))


def create_controlled_unitary(U: np.ndarray) -> np.ndarray:
    """Create controlled version of a unitary operator.

    Args:
        U: Unitary operator

    Returns:
        Controlled unitary operator
    """
    if not np.allclose(U @ U.conj().T, np.eye(len(U))):
        raise ValueError("Input matrix must be unitary")

    n = len(U)
    controlled_U = np.eye(2 * n, dtype=complex)
    controlled_U[n:, n:] = U
    return controlled_U


def quantum_fourier_transform(num_qubits: int) -> np.ndarray:
    """Create quantum Fourier transform operator.

    Args:
        num_qubits: Number of qubits

    Returns:
        QFT operator
    """
    N = 2**num_qubits
    omega = np.exp(2j * np.pi / N)

    # Create QFT matrix
    indices = np.arange(N)
    QFT = np.array([[omega ** (i * j % N) for j in indices] for i in indices])
    return QFT / np.sqrt(N)


def create_phase_estimation_circuit(
    U: np.ndarray, precision_qubits: int
) -> Tuple[np.ndarray, List[int]]:
    """Create quantum phase estimation circuit.

    Args:
        U: Unitary operator to estimate phase of
        precision_qubits: Number of qubits for precision

    Returns:
        Tuple of (circuit matrix, control qubit indices)
    """
    if not np.allclose(U @ U.conj().T, np.eye(len(U))):
        raise ValueError("Input matrix must be unitary")

    n = len(U)
    total_qubits = precision_qubits + int(np.log2(n))

    # Create circuit matrix
    circuit = np.eye(2**total_qubits, dtype=complex)
    control_qubits = list(range(precision_qubits))

    # Add controlled-U operations
    for i in range(precision_qubits):
        power = 2**i
        U_power = linalg.matrix_power(U, power)
        controlled_U = create_controlled_unitary(U_power)
        circuit = controlled_U @ circuit

    return circuit, control_qubits


def create_grover_operator(marked_states: List[int], num_qubits: int) -> np.ndarray:
    """Create Grover diffusion operator.

    Args:
        marked_states: List of marked state indices
        num_qubits: Number of qubits

    Returns:
        Grover operator
    """
    N = 2**num_qubits

    # Create oracle
    oracle = np.eye(N)
    for state in marked_states:
        oracle[state, state] = -1

    # Create diffusion operator
    hadamard = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
    diffusion = linalg.kron(*[hadamard] * num_qubits)

    # Combine operators
    return diffusion @ oracle @ diffusion
