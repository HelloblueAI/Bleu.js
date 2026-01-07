"""
Bleu.js - A state-of-the-art quantum-enhanced vision system with
advanced AI capabilities
"""

import warnings

from pydantic import PydanticDeprecatedSince20

warnings.filterwarnings(
    "ignore",
    message="'crypt' is deprecated",
    category=DeprecationWarning,
)
warnings.filterwarnings(
    "ignore",
    category=PydanticDeprecatedSince20,
)

# Get version from main package
try:
    from src.bleujs import __version__ as __version__
except ImportError:
    __version__ = "1.3.6"  # Fallback
