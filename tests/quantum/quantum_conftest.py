"""Test configuration for quantum computing components."""

from dataclasses import dataclass
from typing import Dict, List, Optional, Set, Union

import numpy as np
import pytest
from qiskit import ClassicalRegister, QuantumCircuit, QuantumRegister
from qiskit.providers.aer import AerSimulator, QasmSimulator, StatevectorSimulator
from qiskit.result import Result


@dataclass
class QuantumBenchmarkResult:
    """Results from quantum benchmarking."""

    circuit_depth: int
    gate_count: int
    execution_time: float
    success_rate: float
    error_rate: float
    entanglement_quality: float
    coherence_time: float
    qubit_utilization: float


def pytest_addoption(parser):
    """Add command line options for quantum testing."""
    parser.addoption(
        "--quantum-backend",
        action="store",
        default="aer_simulator",
        help="Quantum backend to use for testing",
    )
    parser.addoption(
        "--quantum-shots",
        action="store",
        default="1000",
        help="Number of shots for quantum experiments",
    )
    parser.addoption(
        "--skip-quantum-hardware",
        action="store_true",
        default=False,
        help="Skip tests that require quantum hardware",
    )
    parser.addoption(
        "--quantum-benchmark",
        action="store_true",
        default=False,
        help="Run quantum benchmarking",
    )
    parser.addoption(
        "--benchmark-output",
        action="store",
        default="quantum_benchmarks",
        help="Directory to store benchmark results",
    )


def pytest_configure(config):
    """Configure pytest for quantum testing."""
    config.addinivalue_line(
        "markers", "quantum: marks tests that require quantum computing"
    )
    config.addinivalue_line(
        "markers", "quantum_simulator: marks tests that use quantum simulators"
    )
    config.addinivalue_line(
        "markers", "quantum_hardware: marks tests that require actual quantum hardware"
    )
    config.addinivalue_line(
        "markers", "quantum_benchmark: marks tests that perform quantum benchmarking"
    )


def pytest_collection_modifyitems(config, items):
    """Modify test collection based on quantum options."""
    if config.getoption("--skip-quantum-hardware"):
        skip_quantum_hardware = pytest.mark.skip(
            reason="Skipping quantum hardware tests as requested"
        )
        for item in items:
            if "quantum_hardware" in item.keywords:
                item.add_marker(skip_quantum_hardware)


@pytest.fixture
def quantum_backend(request):
    """Provides a quantum backend for testing based on command line option."""
    backend_name = request.config.getoption("--quantum-backend")
    shots = int(request.config.getoption("--quantum-shots"))

    if backend_name == "aer_simulator":
        return AerSimulator(shots=shots)
    elif backend_name == "statevector_simulator":
        return StatevectorSimulator()
    elif backend_name == "qasm_simulator":
        return QasmSimulator(shots=shots)
    else:
        raise ValueError(f"Unsupported quantum backend: {backend_name}")


@pytest.fixture
def quantum_simulator(quantum_backend):
    """Provides a quantum simulator for testing."""
    return quantum_backend


@pytest.fixture
def basic_quantum_circuit():
    """Creates a basic quantum circuit for testing."""
    qr = QuantumRegister(2, "q")
    cr = ClassicalRegister(2, "c")
    circuit = QuantumCircuit(qr, cr)
    return circuit


@pytest.fixture
def entangled_state_circuit(basic_quantum_circuit):
    """Creates an entangled state circuit for testing."""
    circuit = basic_quantum_circuit
    circuit.h(0)  # Hadamard gate on qubit 0
    circuit.cx(0, 1)  # CNOT gate with control qubit 0 and target qubit 1
    circuit.measure_all()
    return circuit


@pytest.fixture
def mock_quantum_result():
    """Provides mock quantum computation results."""
    return {
        "counts": {"00": 500, "11": 500},
        "statevector": [0.707, 0, 0, 0.707],
        "success": True,
    }


def _are_states_valid(counts: Dict[str, int], valid_states: Set[str]) -> bool:
    """Check if all observed states are valid."""
    return set(counts.keys()).issubset(valid_states)


def _are_probabilities_equal(
    counts: Dict[str, int], valid_states: Set[str], tolerance: float
) -> bool:
    """Check if probabilities are approximately equal."""
    total_shots = sum(counts.values())
    probabilities = {
        state: counts.get(state, 0) / total_shots for state in valid_states
    }
    return all(abs(prob - 0.5) <= tolerance for prob in probabilities.values())


def verify_entanglement(result: Result, tolerance: float = 0.1) -> bool:
    """Verify if a quantum state is entangled."""
    counts = result.get_counts()
    if not counts:
        return False
    valid_states = {"00", "11"}
    return _are_states_valid(counts, valid_states) and _are_probabilities_equal(
        counts, valid_states, tolerance
    )


def verify_statevector(
    statevector: Union[List[complex], np.ndarray],
    expected_state: List[complex],
    tolerance: float = 0.01,
) -> bool:
    """Verify if a statevector matches the expected state."""
    if isinstance(statevector, list):
        statevector = np.array(statevector)
    if isinstance(expected_state, list):
        expected_state = np.array(expected_state)
    return np.allclose(statevector, expected_state, atol=tolerance)


def create_random_circuit(
    num_qubits: int, depth: int, seed: Optional[int] = None
) -> QuantumCircuit:
    """Create a random quantum circuit for testing."""
    circuit = QuantumCircuit(num_qubits)
    rng = np.random.default_rng(seed)
    for _ in range(depth):
        for qubit in range(num_qubits):
            if rng.random() < 0.5:
                circuit.h(qubit)
            if qubit < num_qubits - 1 and rng.random() < 0.5:
                circuit.cx(qubit, qubit + 1)
    return circuit


@pytest.fixture
def quantum_test_utils():
    """Provides utility functions for quantum testing."""
    return {
        "verify_entanglement": verify_entanglement,
        "verify_statevector": verify_statevector,
        "create_random_circuit": create_random_circuit,
    }
