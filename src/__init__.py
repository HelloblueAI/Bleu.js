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

# Version and public exceptions (for API and middleware)
from src.version import get_version  # noqa: E402

__version__ = get_version()
from src.middleware.error_handling import (  # noqa: E402
    RateLimitExceeded,
    ServiceUnavailable,
)

__all__ = ["__version__", "get_version", "RateLimitExceeded", "ServiceUnavailable"]
