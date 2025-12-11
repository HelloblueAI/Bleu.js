"""
Bleu.js API Client - Access bleujs.org cloud API

This module provides both synchronous and asynchronous clients for
interacting with the Bleu.js cloud API.

Usage:
    from bleu_ai.api_client import BleuAPIClient

    client = BleuAPIClient(api_key="bleujs_sk_...")
    response = client.chat([{"role": "user", "content": "Hello!"}])
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
    ]

__version__ = "1.2.2"
