"""
Abstract base class for all QuantumProcessor variants in Bleu.js.
Defines the required interface for quantum processors, regardless of backend.
"""

from abc import ABC, abstractmethod
from typing import Any

import numpy as np


class QuantumProcessorBase(ABC):
    """Abstract base class for quantum processors."""

    @abstractmethod
    def initialize(self) -> None:
        """Initialize the quantum processor and its resources."""
        pass

    @abstractmethod
    def process_features(self, features: np.ndarray) -> Any:
        """Process features using quantum computing."""
        pass

    @abstractmethod
    def apply_error_correction(self) -> None:
        """Apply quantum error correction if supported."""
        pass

    @abstractmethod
    def get_backend_name(self) -> str:
        """Return the name of the quantum backend (e.g., Qiskit, PennyLane, Cirq)."""
        pass
