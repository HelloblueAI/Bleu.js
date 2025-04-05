"""
Core package for Bleu.js backend.
"""

from .error_handling import error_handler
from .performance import performance_optimizer

__all__ = ["error_handler", "performance_optimizer"]
