"""
Bleujs - Quantum-Enhanced AI Platform

A state-of-the-art quantum-enhanced vision system with advanced AI capabilities.
"""

__version__ = "1.2.1"

# Optional API client import
try:
    from .api_client import BleuAPIClient, AsyncBleuAPIClient
    __all__ = ["BleuAPIClient", "AsyncBleuAPIClient", "__version__"]
except ImportError:
    __all__ = ["__version__"]
