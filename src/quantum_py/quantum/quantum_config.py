"""Quantum configuration module."""

from dataclasses import dataclass
from typing import Optional


@dataclass
class QuantumConfig:
    """Configuration for quantum components."""

    n_qubits: int = 4
    n_layers: int = 2
    shots: int = 1000
    backend: str = "default.qubit"
    optimization_level: int = 2
    error_correction: bool = True
    use_advanced_circuits: bool = True
    learning_rate: float = 0.01
    max_iterations: int = 100
    tolerance: float = 1e-6
