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

__version__ = "1.2.2"
__author__ = "Bleujs Team"
__email__ = "support@helloblue.ai"
__license__ = "MIT"

# Core imports (always available)
from .core import BleuJS
from .utils import check_dependencies, get_device, setup_logging

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

# Optional API client import
try:
    from . import api_client
except ImportError:
    api_client = None

__all__ = [
    "BleuJS",
    "setup_logging",
    "get_device",
    "check_dependencies",
    "quantum",
    "ml",
    "monitoring",
    "security",
    "api_client",
    "__version__",
]
