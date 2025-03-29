"""
Bleu.js - A state-of-the-art quantum-enhanced vision system
"""

__version__ = "1.1.3"
__author__ = "Helloblue, Inc."
__email__ = "support@helloblue.ai"

from .quantum_detector import AdvancedQuantumDetector
from .utils import setup_logging, get_metrics

__all__ = ["AdvancedQuantumDetector", "setup_logging", "get_metrics"]
