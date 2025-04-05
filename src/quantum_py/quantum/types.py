from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Tuple, Union

import numpy as np


class GateType(str, Enum):
    H = "H"
    X = "X"
    Y = "Y"
    Z = "Z"
    CNOT = "CNOT"
    SWAP = "SWAP"
    TOFFOLI = "TOFFOLI"


class MeasurementBasis(str, Enum):
    COMPUTATIONAL = "computational"
    HADAMARD = "hadamard"
    PHASE = "phase"


class ErrorSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


@dataclass
class Qubit:
    state: np.ndarray = field(default_factory=lambda: np.array([1.0, 0.0]))
    error_rate: float = 0.0
    coherence: float = 1.0
    last_measurement: Optional[float] = None
    entanglement: Optional[int] = None


@dataclass
class QuantumState:
    qubits: List[Qubit]
    entanglement: Dict[str, float] = field(default_factory=dict)
    error_rates: Dict[str, float] = field(default_factory=dict)
    global_phase: float = 0.0
    density_matrix: Optional[np.ndarray] = None


@dataclass
class QuantumGate:
    type: GateType
    target: int
    control: Optional[int] = None
    parameters: Dict[str, float] = field(default_factory=dict)
    error_rate: float = 0.0
    duration: float = 0.0


@dataclass
class QuantumCircuit:
    gates: List[QuantumGate] = field(default_factory=list)
    measurements: List[Tuple[int, MeasurementBasis]] = field(default_factory=list)
    optimization_metrics: Dict[str, float] = field(
        default_factory=lambda: {
            "depth": 0.0,
            "fidelity": 1.0,
            "noise": 0.0,
            "error_correction": 0.0,
        }
    )
    max_qubits: int = 8


@dataclass
class QuantumMeasurement:
    qubit: int
    basis: MeasurementBasis
    result: int
    timestamp: float
    error_rate: float


@dataclass
class QuantumError:
    type: str
    qubit: int
    severity: ErrorSeverity
    timestamp: float
    details: Dict[str, Union[str, float, int]] = field(default_factory=dict)


@dataclass
class QuantumOptimization:
    target: str
    constraints: Dict[str, float] = field(default_factory=dict)
    algorithm_type: str = "default"
    parameters: Dict[str, float] = field(default_factory=dict)


@dataclass
class QuantumBackend:
    name: str
    capabilities: Dict[str, Union[List[str], Dict[str, float], float]] = field(
        default_factory=lambda: {
            "max_qubits": 8,
            "gate_types": [gt.value for gt in GateType],
            "error_rates": {},
            "coherence_time": 1000.0,
        }
    )
    constraints: Dict[str, float] = field(
        default_factory=lambda: {
            "max_circuit_depth": 100.0,
            "max_gates_per_qubit": 1000.0,
            "min_coherence": 0.8,
        }
    )
    metrics: Dict[str, float] = field(
        default_factory=lambda: {
            "fidelity": 0.99,
            "error_rate": 0.01,
            "execution_time": 0.0,
        }
    )
