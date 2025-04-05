from dataclasses import dataclass
from enum import Enum, auto
from typing import Dict, List, Optional, Protocol

import numpy as np

from ..core.quantum_circuit import QuantumCircuit


class QuantumGateType(Enum):
    """Enumeration of quantum gate types."""

    SINGLE_QUBIT = auto()
    TWO_QUBIT = auto()
    THREE_QUBIT = auto()
    MULTI_QUBIT = auto()
    CONTROLLED = auto()
    CUSTOM = auto()


class NoiseType(Enum):
    """Enumeration of quantum noise types."""

    DEPOLARIZING = auto()
    AMPLITUDE_DAMPING = auto()
    PHASE_DAMPING = auto()
    BIT_FLIP = auto()
    PHASE_FLIP = auto()
    CUSTOM = auto()


@dataclass
class QuantumGateSpec:
    """Specification for a quantum gate."""

    name: str
    type: QuantumGateType
    matrix: np.ndarray
    target_qubits: List[int]
    control_qubits: Optional[List[int]] = None
    phase: float = 0.0
    error_rate: float = 0.001
    description: Optional[str] = None


@dataclass
class NoiseSpec:
    """Specification for quantum noise."""

    type: NoiseType
    strength: float
    targets: List[int]
    correlation_length: Optional[float] = None
    custom_channel: Optional[np.ndarray] = None
    description: Optional[str] = None


@dataclass
class MeasurementResult:
    """Result of a quantum measurement."""

    qubit_indices: List[int]
    outcomes: Dict[int, int]
    probabilities: Dict[int, float]
    basis: Optional[str] = "computational"
    timestamp: Optional[float] = None
    metadata: Optional[Dict] = None


@dataclass
class QuantumStateData:
    """Data structure for quantum state information."""

    num_qubits: int
    amplitudes: np.ndarray
    phase: float = 0.0
    is_mixed: bool = False
    density_matrix: Optional[np.ndarray] = None
    entanglement_entropy: Optional[float] = None
    fidelity: Optional[float] = None


@dataclass
class ErrorCorrectionData:
    """Data structure for error correction information."""

    code_type: str
    encoding_circuit: "QuantumCircuit"
    syndrome_circuit: "QuantumCircuit"
    recovery_operations: Dict[str, List[QuantumGateSpec]]
    logical_qubits: List[int]
    ancilla_qubits: List[int]
    success_rate: float = 0.0


@dataclass
class ProcessorStats:
    """Statistics for quantum processor performance."""

    total_gates: int = 0
    error_count: int = 0
    correction_count: int = 0
    decoherence_events: int = 0
    average_fidelity: float = 1.0
    execution_time: float = 0.0
    memory_usage: float = 0.0


class QuantumOperation(Protocol):
    """Protocol for quantum operations."""

    def apply(self, state: QuantumStateData) -> QuantumStateData:
        """Apply operation to quantum state."""
        ...

    def adjoint(self) -> "QuantumOperation":
        """Return adjoint of operation."""
        ...

    def tensor_product(self, other: "QuantumOperation") -> "QuantumOperation":
        """Compute tensor product with another operation."""
        ...

    def decompose(self) -> List[QuantumGateSpec]:
        """Decompose operation into basic gates."""
        ...


@dataclass
class QuantumRegister:
    """Quantum register for storing qubits."""

    size: int
    state: QuantumStateData
    allocated_qubits: List[int]
    available_qubits: List[int]
    error_rates: Dict[int, float]
    coherence_times: Dict[int, float]

    def allocate(self, num_qubits: int) -> List[int]:
        """Allocate qubits from register."""
        if len(self.available_qubits) < num_qubits:
            raise ValueError("Not enough qubits available")

        allocated = self.available_qubits[:num_qubits]
        self.available_qubits = self.available_qubits[num_qubits:]
        self.allocated_qubits.extend(allocated)
        return allocated

    def deallocate(self, qubits: List[int]) -> None:
        """Return qubits to register."""
        for qubit in qubits:
            if qubit in self.allocated_qubits:
                self.allocated_qubits.remove(qubit)
                self.available_qubits.append(qubit)
        self.available_qubits.sort()


@dataclass
class QuantumCircuitData:
    """Data structure for quantum circuit information."""

    num_qubits: int
    gates: List[QuantumGateSpec]
    measurements: List[MeasurementResult]
    noise: Optional[NoiseSpec] = None
    error_correction: Optional[ErrorCorrectionData] = None
    initial_state: Optional[QuantumStateData] = None
    final_state: Optional[QuantumStateData] = None
    stats: Optional[ProcessorStats] = None

    def validate(self) -> bool:
        """Validate circuit configuration."""
        # Check qubit indices
        all_qubits = set()
        for gate in self.gates:
            all_qubits.update(gate.target_qubits)
            if gate.control_qubits:
                all_qubits.update(gate.control_qubits)

        if max(all_qubits) >= self.num_qubits:
            return False

        # Check unitarity of gates
        for gate in self.gates:
            if not np.allclose(
                gate.matrix @ gate.matrix.conj().T, np.eye(len(gate.matrix))
            ):
                return False

        return True

    def depth(self) -> int:
        """Calculate circuit depth."""
        if not self.gates:
            return 0

        layers = []
        for gate in self.gates:
            qubits = set(gate.target_qubits)
            if gate.control_qubits:
                qubits.update(gate.control_qubits)

            # Find first layer without overlap
            placed = False
            for layer in layers:
                if not any(qubits & layer_qubits for layer_qubits in layer):
                    layer.append(qubits)
                    placed = True
                    break

            if not placed:
                layers.append([qubits])

        return len(layers)


@dataclass
class QuantumAlgorithmSpec:
    """Specification for quantum algorithms."""

    name: str
    circuit: QuantumCircuitData
    parameters: Dict
    expected_output: Optional[Dict] = None
    success_criteria: Optional[Dict] = None
    resource_requirements: Optional[Dict] = None

    def estimate_resources(self) -> Dict:
        """Estimate required resources."""
        return {
            "num_qubits": self.circuit.num_qubits,
            "circuit_depth": self.circuit.depth(),
            "gate_count": len(self.circuit.gates),
            "measurement_count": len(self.circuit.measurements),
            "error_correction_overhead": (
                len(self.circuit.error_correction.ancilla_qubits)
                if self.circuit.error_correction
                else 0
            ),
        }
