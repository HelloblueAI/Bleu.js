"""
Shared constants for Bleu.js project
"""

# Error messages
CIPHER_SUITE_ERROR = "Cipher suite not initialized"
QUANTUM_CIRCUIT_ERROR = "Quantum circuit not initialized"
TIME_LABEL = "Time (s)"

# App identity (for tests and config). Version from single source: bleujs.__version__
APP_NAME = "Bleu.js"


def _get_version() -> str:
    try:
        from src.version import get_version

        return get_version()
    except Exception:
        return "0.0.0"


VERSION = _get_version()

# Add more as needed...
