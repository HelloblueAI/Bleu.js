"""
Quantum computing core module.

This module provides core quantum computing functionality.
"""

__version__ = "1.1.7"

from .circuit import QuantumCircuit
from .processor import QuantumProcessor

__all__ = ["QuantumCircuit", "QuantumProcessor"]
