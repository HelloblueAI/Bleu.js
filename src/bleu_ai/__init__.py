"""
Bleu.js compatibility package.

Open-source SDK and API client, with optional ML and quantum modules.
"""

__version__ = "1.5.177"

# Optional API client import
try:
    from .api_client import AsyncBleuAPIClient, BleuAPIClient

    __all__ = ["BleuAPIClient", "AsyncBleuAPIClient", "__version__"]
except ImportError:
    __all__ = ["__version__"]
