"""
Bleu.js API Client – access the bleujs.org cloud API.

Synchronous and async clients with retries, timeouts, and typed errors.
Get an API key at https://bleujs.org and set BLEUJS_API_KEY or pass api_key=.

The client accepts multiple response shapes from the API (OpenAI-style,
flat content, plain string, or list forms) and normalizes them so you always
get consistent Pydantic models. Use ``bleu --debug`` to log when alternate
shapes are detected.

Usage:
    from bleujs.api_client import BleuAPIClient

    client = BleuAPIClient(api_key="bleujs_sk_...")
    response = client.chat([{"role": "user", "content": "Hello!"}])

Best practice: Use context manager for cleanup: ``with BleuAPIClient(...) as c: ...``
"""

from .client import BleuAPIClient
from .exceptions import (
    APIError,
    AuthenticationError,
    BleuAPIError,
    InvalidRequestError,
    NetworkError,
    RateLimitError,
    ValidationError,
)
from .models import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatMessage,
    EmbeddingRequest,
    EmbeddingResponse,
    GenerationRequest,
    GenerationResponse,
    Model,
    ModelListResponse,
)

# Optional async client import
try:
    from .async_client import AsyncBleuAPIClient

    __all__ = [
        "BleuAPIClient",
        "AsyncBleuAPIClient",
        "BleuAPIError",
        "AuthenticationError",
        "RateLimitError",
        "InvalidRequestError",
        "APIError",
        "NetworkError",
        "ValidationError",
        "ChatMessage",
        "ChatCompletionRequest",
        "ChatCompletionResponse",
        "GenerationRequest",
        "GenerationResponse",
        "EmbeddingRequest",
        "EmbeddingResponse",
        "Model",
        "ModelListResponse",
    ]
except ImportError:
    __all__ = [
        "BleuAPIClient",
        "BleuAPIError",
        "AuthenticationError",
        "RateLimitError",
        "InvalidRequestError",
        "APIError",
        "NetworkError",
        "ValidationError",
        "ChatMessage",
        "ChatCompletionRequest",
        "ChatCompletionResponse",
        "GenerationRequest",
        "GenerationResponse",
        "EmbeddingRequest",
        "EmbeddingResponse",
        "Model",
        "ModelListResponse",
    ]

# Get version from main package
try:
    from .. import __version__ as __version__
except ImportError:
    __version__ = "0.0.0"
