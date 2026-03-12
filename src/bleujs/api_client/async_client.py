"""
Asynchronous client for Bleu.js API

This module provides an async HTTP client for interacting with
the Bleu.js cloud API at https://bleujs.org
"""

import asyncio
import os
import random
from types import TracebackType
from typing import Any, Dict, List, Optional, Type, Union
from urllib.parse import urljoin

try:
    import httpx
except ImportError:
    httpx = None

try:
    from .. import __version__ as _CLIENT_VERSION
except ImportError:
    _CLIENT_VERSION = "0.0.0"

from ._shared import (
    build_chat_response,
    build_embed_response,
    build_generate_response,
    compute_retry_delay,
    handle_response,
)
from .constants import (
    DEFAULT_BASE_URL,
    DEFAULT_CONNECT_TIMEOUT,
    DEFAULT_MAX_RETRIES,
    DEFAULT_MODEL_CHAT,
    DEFAULT_MODEL_EMBED,
    DEFAULT_MODEL_GENERATE,
    DEFAULT_TIMEOUT,
    ENDPOINT_CHAT,
    ENDPOINT_EMBED,
    ENDPOINT_GENERATE,
    ENDPOINT_HEALTH,
    ENDPOINT_MODELS,
)
from .constants import get_headers as _get_headers_shared
from .exceptions import AuthenticationError, BleuAPIError, NetworkError, ValidationError
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


class AsyncBleuAPIClient:
    """
    Asynchronous client for Bleu.js API

    Usage:
        async with AsyncBleuAPIClient(api_key="bleujs_sk_...") as client:
            response = await client.chat([{"role": "user", "content": "Hello!"}])

    Args:
        api_key: Your Bleu.js API key (or set BLEUJS_API_KEY env var)
        base_url: Base URL for API (default from constants)
        timeout: Read timeout in seconds, or (connect_secs, read_secs) tuple
            (default: 60; connect uses 5s). Industry-standard.
        max_retries: Max retries for network/timeout and 429/503 (default: 3).
        retry_on_rate_limit: If True (default), retry on 429/503 with backoff.
    """

    DEFAULT_BASE_URL = DEFAULT_BASE_URL
    DEFAULT_TIMEOUT = DEFAULT_TIMEOUT
    DEFAULT_MAX_RETRIES = DEFAULT_MAX_RETRIES

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: Union[float, tuple] = DEFAULT_TIMEOUT,
        max_retries: int = DEFAULT_MAX_RETRIES,
        retry_on_rate_limit: bool = True,
    ):
        if httpx is None:
            raise ImportError(
                "httpx is required for API client. Install with: pip install bleu-js"
            )

        self.api_key = api_key or os.getenv("BLEUJS_API_KEY")
        if not self.api_key:
            raise AuthenticationError(
                "API key is required. Set BLEUJS_API_KEY environment variable "
                "or pass api_key parameter."
            )

        self.base_url = base_url or os.getenv("BLEUJS_BASE_URL", self.DEFAULT_BASE_URL)
        self.timeout = timeout
        self.max_retries = max_retries
        self.retry_on_rate_limit = retry_on_rate_limit

        if isinstance(timeout, (int, float)):
            read_secs = float(timeout)
            _timeout = httpx.Timeout(
                read_secs,
                connect=DEFAULT_CONNECT_TIMEOUT,
            )
        else:
            connect_t, read_t = timeout
            _timeout = httpx.Timeout(
                float(read_t),
                connect=float(connect_t),
            )

        self._client = httpx.AsyncClient(
            timeout=_timeout,
            headers=_get_headers_shared(self.api_key, _CLIENT_VERSION),
        )

    def _build_url(self, endpoint: str) -> str:
        """Build full URL from endpoint"""
        return urljoin(self.base_url, endpoint)

    async def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Make async HTTP request with retries and error handling

        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint path
            data: Request body (for POST/PUT)
            params: Query parameters

        Returns:
            Response data as dictionary

        Raises:
            BleuAPIError: On API errors
            NetworkError: On network errors
        """
        url = self._build_url(endpoint)
        last_error = None

        for attempt in range(self.max_retries):
            try:
                response = await self._client.request(
                    method=method,
                    url=url,
                    json=data,
                    params=params,
                )
                if response.status_code in (429, 503) and self.retry_on_rate_limit:
                    if attempt < self.max_retries - 1:
                        delay = compute_retry_delay(response, attempt)
                        await asyncio.sleep(delay)
                        continue
                return handle_response(response)
            except BleuAPIError:
                raise
            except httpx.TimeoutException as e:
                last_error = NetworkError(f"Request timeout: {str(e)}")
            except httpx.NetworkError as e:
                last_error = NetworkError(f"Network error: {str(e)}")

            if attempt < self.max_retries - 1:
                await asyncio.sleep(2**attempt + (random.random() * 0.5))

        if last_error:
            raise last_error
        raise NetworkError("Request failed after all retries")

    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: str = DEFAULT_MODEL_CHAT,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs: Any,
    ) -> ChatCompletionResponse:
        """
        Create a chat completion (async)

        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Model to use (default: bleu-chat-v1)
            temperature: Sampling temperature 0-2 (default: 0.7)
            max_tokens: Maximum tokens to generate
            **kwargs: Additional parameters

        Returns:
            ChatCompletionResponse object

        Example:
            response = await client.chat([
                {"role": "system", "content": "You are helpful."},
                {"role": "user", "content": "Hello!"}
            ])
            print(response.content)
        """
        # Convert dict messages to ChatMessage objects
        chat_messages = [ChatMessage(**msg) for msg in messages]

        # Build request
        request = ChatCompletionRequest(
            messages=chat_messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs,
        )

        # Make API call
        response_data = await self._request(
            method="POST",
            endpoint=ENDPOINT_CHAT,
            data=request.model_dump(exclude_none=True),
        )
        return build_chat_response(response_data)

    async def generate(
        self,
        prompt: str,
        model: str = DEFAULT_MODEL_GENERATE,
        temperature: float = 0.7,
        max_tokens: int = 256,
        **kwargs: Any,
    ) -> GenerationResponse:
        """
        Generate text from a prompt (async)

        Args:
            prompt: The prompt to generate from
            model: Model to use (default: bleu-gen-v1)
            temperature: Sampling temperature 0-2 (default: 0.7)
            max_tokens: Maximum tokens to generate (default: 256)
            **kwargs: Additional parameters

        Returns:
            GenerationResponse object

        Example:
            response = await client.generate("Once upon a time")
            print(response.text)
        """
        request = GenerationRequest(
            prompt=prompt,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs,
        )

        response_data = await self._request(
            method="POST",
            endpoint=ENDPOINT_GENERATE,
            data=request.model_dump(exclude_none=True),
        )
        return build_generate_response(response_data)

    async def embed(
        self,
        texts: List[str],
        model: str = DEFAULT_MODEL_EMBED,
        **kwargs: Any,
    ) -> EmbeddingResponse:
        """
        Create embeddings for texts (async)

        Args:
            texts: List of texts to embed (max 100)
            model: Model to use (default: bleu-embed-v1)
            **kwargs: Additional parameters

        Returns:
            EmbeddingResponse object

        Example:
            response = await client.embed(["Hello world", "Goodbye world"])
            embeddings = response.embeddings
        """
        if not texts:
            raise ValidationError("texts list cannot be empty")
        if len(texts) > 100:
            raise ValidationError("Maximum 100 texts allowed per request")

        request = EmbeddingRequest(
            input=texts,
            model=model,
            **kwargs,
        )

        response_data = await self._request(
            method="POST",
            endpoint=ENDPOINT_EMBED,
            data=request.model_dump(exclude_none=True),
        )
        return build_embed_response(response_data)

    async def health(self) -> Dict[str, Any]:
        """
        Check API health (GET /health). Async.

        Returns:
            Health response dict (e.g. status, version). On failure (e.g. 404),
            raises; callers can fall back to list_models() for connectivity check.
        """
        return await self._request(method="GET", endpoint=ENDPOINT_HEALTH)

    async def list_models(self) -> List[Model]:
        """
        List available models (async)

        Returns:
            List of Model objects

        Example:
            models = await client.list_models()
            for model in models:
                print(f"{model.id}: {model.description}")
        """
        response_data = await self._request(
            method="GET",
            endpoint=ENDPOINT_MODELS,
        )

        model_list = ModelListResponse(**response_data)
        return model_list.data

    async def close(self) -> None:
        """Close the HTTP client."""
        await self._client.aclose()

    async def __aenter__(self) -> "AsyncBleuAPIClient":
        """Async context manager entry."""
        return self

    async def __aexit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType],
    ) -> None:
        """Async context manager exit."""
        await self.close()

    def __del__(self) -> None:
        """Cleanup on deletion. Use 'async with AsyncBleuAPIClient(...) as client' when possible so aclose() runs reliably; __del__ cannot safely run async code."""
        pass
