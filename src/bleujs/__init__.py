"""
Bleu.js - Quantum-Enhanced AI Platform
=======================================

A state-of-the-art quantum-enhanced vision system with advanced AI capabilities.

Basic Usage:
    >>> from bleujs import BleuJS
    >>> bleu = BleuJS()
    >>> result = bleu.process({'data': [1, 2, 3]})
    >>> print(result['status'])
    'success'

Advanced Usage with Quantum Features:
    >>> from bleujs import BleuJS
    >>> from bleujs.quantum import QuantumFeatureExtractor
    >>> bleu = BleuJS(quantum_mode=True)
    >>> result = bleu.process(data, quantum_features=True)

Machine Learning:
    >>> from bleujs.ml import HybridTrainer
    >>> trainer = HybridTrainer(model_type='xgboost')
    >>> model = trainer.train(X_train, y_train)

For more examples, see: https://github.com/HelloblueAI/Bleu.js
"""

__version__ = "1.4.8"
__author__ = "Bleujs Team"
__email__ = "support@helloblue.ai"
__license__ = "MIT"

# Core imports (always available)
from .core import BleuJS
from .utils import check_dependencies, get_device, get_version, setup_logging

# Optional imports (fail gracefully)
try:
    from . import quantum
except ImportError:
    quantum = None

try:
    from . import ml
except ImportError:
    ml = None

try:
    from . import monitoring
except ImportError:
    monitoring = None

try:
    from . import security
except ImportError:
    security = None

# API client exceptions (always available; no httpx dependency)
try:
    from .api_client.exceptions import (
        AuthenticationError,
        BleuAPIError,
        NetworkError,
        RateLimitError,
        ValidationError,
    )
except ImportError:
    AuthenticationError = None  # type: ignore[misc, assignment]
    BleuAPIError = None  # type: ignore[misc, assignment]
    NetworkError = None  # type: ignore[misc, assignment]
    RateLimitError = None  # type: ignore[misc, assignment]
    ValidationError = None  # type: ignore[misc, assignment]

# Optional API client (requires httpx)
try:
    from . import api_client
except ImportError:
    api_client = None

# Optional quantum teleportation (requires bleu-js[quantum])
try:
    from . import teleportation
except ImportError:
    teleportation = None

try:
    from . import ibm_runtime
except ImportError:
    ibm_runtime = None

__all__ = [
    "__version__",
    "AuthenticationError",
    "BleuAPIError",
    "BleuJS",
    "NetworkError",
    "RateLimitError",
    "ValidationError",
    "api_client",
    "check_dependencies",
    "get_device",
    "get_version",
    "ml",
    "monitoring",
    "quantum",
    "security",
    "setup_logging",
    "teleportation",
    "ibm_runtime",
]
