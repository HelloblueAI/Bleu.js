import numpy as np
import pytest

from ..core.quantum_circuit import QuantumCircuit
from ..core.quantum_processor import ProcessorConfig, QuantumProcessor
from ..core.quantum_state import QuantumState
from ..types.quantum_types import (
    QuantumCircuitData,
    QuantumGateSpec,
    QuantumGateType,
    QuantumRegister,
    QuantumStateData,
)
from ..utils.quantum_utils import (
    concurrence,
    create_bell_state,
    create_controlled_unitary,
    create_ghz_state,
    create_grover_operator,
    create_phase_estimation_circuit,
    create_w_state,
    fidelity,
    partial_trace,
    quantum_fourier_transform,
    quantum_mutual_information,
    von_neumann_entropy,
)


def test_quantum_state_initialization():
    """Test quantum state initialization."""
    num_qubits = 3
    state = QuantumState(num_qubits)

    assert state.num_qubits == num_qubits
    assert len(state.amplitudes) == 2**num_qubits
    assert np.allclose(state.amplitudes[0], 1)  # |000⟩ state
    assert np.allclose(np.sum(np.abs(state.amplitudes) ** 2), 1)  # Normalized


def test_quantum_gate_application():
    """Test quantum gate application."""
    circuit = QuantumCircuit(2)

    # Apply Hadamard to first qubit
    circuit.add_gate("H", [0])

    # Apply CNOT
    circuit.add_gate("CNOT", [1], [0])

    # Final state should be (|00⟩ + |11⟩)/√2
    state = circuit.get_state()
    expected = np.array([1, 0, 0, 1]) / np.sqrt(2)
    assert np.allclose(state, expected)


def test_bell_state_creation():
    """Test Bell state creation."""
    for i in range(4):
        state = create_bell_state(i)
        assert len(state) == 4
        assert np.allclose(np.sum(np.abs(state) ** 2), 1)


def test_ghz_state_creation():
    """Test GHZ state creation."""
    num_qubits = 4
    state = create_ghz_state(num_qubits)

    assert len(state) == 2**num_qubits
    assert np.allclose(np.sum(np.abs(state) ** 2), 1)
    assert np.allclose(state[0], 1 / np.sqrt(2))  # |0000⟩
    assert np.allclose(state[-1], 1 / np.sqrt(2))  # |1111⟩


def test_w_state_creation():
    """Test W state creation."""
    num_qubits = 3
    state = create_w_state(num_qubits)

    assert len(state) == 2**num_qubits
    assert np.allclose(np.sum(np.abs(state) ** 2), 1)
    # Check that exactly one qubit is in |1⟩ state
    assert np.count_nonzero(state) == num_qubits


def test_partial_trace():
    """Test partial trace calculation."""
    # Create Bell state
    state = create_bell_state(0)
    reduced = partial_trace(state, [1], 2)

    # Should be maximally mixed state
    expected = np.eye(2) / 2
    assert np.allclose(reduced, expected)


def test_von_neumann_entropy():
    """Test von Neumann entropy calculation."""
    # Pure state should have zero entropy
    state = create_bell_state(0)
    entropy = von_neumann_entropy(state)
    assert np.isclose(entropy, 0)

    # Maximally mixed state should have entropy = 1
    mixed = np.eye(2) / 2
    entropy = von_neumann_entropy(mixed)
    assert np.isclose(entropy, 1)


def test_concurrence():
    """Test concurrence calculation."""
    # Bell state should have concurrence = 1
    state = create_bell_state(0)
    C = concurrence(state)
    assert np.isclose(C, 1)

    # Product state should have concurrence = 0
    product = np.array([1, 0, 0, 0])  # |00⟩
    C = concurrence(product)
    assert np.isclose(C, 0)


def test_quantum_mutual_information():
    """Test quantum mutual information calculation."""
    # Bell state should have mutual information = 2
    state = create_bell_state(0)
    MI = quantum_mutual_information(state, [0], [1], 2)
    assert np.isclose(MI, 2)

    # Product state should have mutual information = 0
    product = np.array([1, 0, 0, 0])  # |00⟩
    MI = quantum_mutual_information(product, [0], [1], 2)
    assert np.isclose(MI, 0)


def test_fidelity():
    """Test fidelity calculation."""
    state1 = create_bell_state(0)
    state2 = create_bell_state(0)
    F = fidelity(state1, state2)
    assert np.isclose(F, 1)  # Same states

    state2 = create_bell_state(1)
    F = fidelity(state1, state2)
    assert np.isclose(F, 0)  # Orthogonal states


def test_controlled_unitary():
    """Test controlled unitary creation."""
    # NOT gate
    X = np.array([[0, 1], [1, 0]])
    CX = create_controlled_unitary(X)

    assert CX.shape == (4, 4)
    assert np.allclose(CX @ CX.conj().T, np.eye(4))


def test_quantum_fourier_transform():
    """Test quantum Fourier transform."""
    num_qubits = 2
    QFT = quantum_fourier_transform(num_qubits)

    assert QFT.shape == (4, 4)
    assert np.allclose(QFT @ QFT.conj().T, np.eye(4))


def test_phase_estimation_circuit():
    """Test phase estimation circuit creation."""
    # Phase gate
    phase = np.exp(2j * np.pi / 8)
    U = np.array([[1, 0], [0, phase]])

    circuit, control_qubits = create_phase_estimation_circuit(U, 3)
    assert len(control_qubits) == 3
    assert np.allclose(circuit @ circuit.conj().T, np.eye(len(circuit)))


def test_grover_operator():
    """Test Grover operator creation."""
    num_qubits = 2
    marked_states = [3]  # Mark state |11⟩
    G = create_grover_operator(marked_states, num_qubits)

    assert G.shape == (4, 4)
    assert np.allclose(G @ G.conj().T, np.eye(4))


def test_quantum_register():
    """Test quantum register operations."""
    register = QuantumRegister(
        size=4,
        state=QuantumStateData(num_qubits=4, amplitudes=np.zeros(16), phase=0.0),
        allocated_qubits=[],
        available_qubits=list(range(4)),
        error_rates={i: 0.001 for i in range(4)},
        coherence_times={i: 1000.0 for i in range(4)},
    )

    # Allocate qubits
    qubits = register.allocate(2)
    assert len(qubits) == 2
    assert len(register.available_qubits) == 2

    # Deallocate qubits
    register.deallocate(qubits)
    assert len(register.available_qubits) == 4


def test_quantum_circuit_validation():
    """Test quantum circuit validation."""
    circuit_data = QuantumCircuitData(
        num_qubits=2,
        gates=[
            QuantumGateSpec(
                name="H",
                type=QuantumGateType.SINGLE_QUBIT,
                matrix=np.array([[1, 1], [1, -1]]) / np.sqrt(2),
                target_qubits=[0],
            )
        ],
        measurements=[],
    )

    assert circuit_data.validate()

    # Invalid qubit index
    circuit_data.gates[0].target_qubits = [2]
    assert not circuit_data.validate()


def test_quantum_processor():
    """Test quantum processor operations."""
    config = ProcessorConfig(
        num_qubits=2,
        error_rate=0.001,
        decoherence_time=1000.0,
        gate_time=0.1,
        num_workers=1,
        max_depth=100,
        optimization_level=1,
        use_error_correction=True,
        noise_model="depolarizing",
    )

    processor = QuantumProcessor(config)

    # Create and apply Bell state circuit
    circuit = QuantumCircuit(2)
    circuit.add_gate("H", [0])
    circuit.add_gate("CNOT", [1], [0])

    final_state = processor.apply_circuit(circuit)
    expected = create_bell_state(0)
    assert np.allclose(final_state, expected)


def test_error_correction():
    """Test error correction functionality."""
    config = ProcessorConfig(
        num_qubits=7,  # Steane code
        error_rate=0.1,  # High error rate
        use_error_correction=True,
    )

    processor = QuantumProcessor(config)

    # Create simple circuit
    circuit = QuantumCircuit(7)
    circuit.add_gate("X", [0])  # Bit flip on first qubit

    # Apply circuit with error correction
    processor.apply_circuit(circuit)

    # State should be corrected
    assert processor.circuit.error_correction is not None


def test_noise_models():
    """Test different noise models."""
    for noise_type in ["depolarizing", "amplitude_damping", "phase_damping"]:
        config = ProcessorConfig(num_qubits=1, error_rate=0.1, noise_model=noise_type)

        processor = QuantumProcessor(config)

        # Apply X gate with noise
        circuit = QuantumCircuit(1)
        circuit.add_gate("X", [0])

        final_state = processor.apply_circuit(circuit)
        assert np.allclose(np.sum(np.abs(final_state) ** 2), 1)  # Still normalized


if __name__ == "__main__":
    pytest.main([__file__])
