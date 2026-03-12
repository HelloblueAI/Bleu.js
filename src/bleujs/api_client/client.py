"""
Synchronous client for Bleu.js API

This module provides a synchronous HTTP client for interacting with
the Bleu.js cloud API at https://bleujs.org
"""

import os
import random
import time
from typing import Any, Dict, List, Optional, Union
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
    DEFAULT_READ_TIMEOUT,
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


class BleuAPIClient:
    """
    Synchronous client for Bleu.js API

    Usage:
        client = BleuAPIClient(api_key="bleujs_sk_...")
        response = client.chat([{"role": "user", "content": "Hello!"}])

    Args:
        api_key: Your Bleu.js API key (or set BLEUJS_API_KEY env var)
        base_url: Base URL for API (default from constants)
        timeout: Read timeout in seconds, or (connect_secs, read_secs) tuple
            (default: 60; connect uses 5s for fast-fail). Industry-standard.
        max_retries: Max retries for network/timeout and for 429/503 when
            retry_on_rate_limit is True (default: 3).
        retry_on_rate_limit: If True (default), retry on 429/503 with backoff
            and optional Retry-After header. Set False to fail immediately.
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
        self._timeout = _timeout

        self._client = httpx.Client(
            timeout=_timeout,
            headers=_get_headers_shared(self.api_key, _CLIENT_VERSION),
        )

    def _build_url(self, endpoint: str) -> str:
        """Build full URL from endpoint"""
        return urljoin(self.base_url, endpoint)

    def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Make HTTP request with retries and error handling

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
                response = self._client.request(
                    method=method,
                    url=url,
                    json=data,
                    params=params,
                )
                # Retry 429/503 with backoff when enabled (best-in-market behavior)
                if response.status_code in (429, 503) and self.retry_on_rate_limit:
                    if attempt < self.max_retries - 1:
                        delay = compute_retry_delay(response, attempt)
                        time.sleep(delay)
                        continue
                return handle_response(response)
            except BleuAPIError:
                raise
            except httpx.TimeoutException as e:
                last_error = NetworkError(f"Request timeout: {str(e)}")
            except httpx.NetworkError as e:
                last_error = NetworkError(f"Network error: {str(e)}")

            # Exponential backoff for network/timeout errors
            if attempt < self.max_retries - 1:
                time.sleep(2**attempt + (random.random() * 0.5))

        if last_error:
            raise last_error
        raise NetworkError("Request failed after all retries")

    def chat(
        self,
        messages: List[Dict[str, str]],
        model: str = DEFAULT_MODEL_CHAT,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs: Any,
    ) -> ChatCompletionResponse:
        """
        Create a chat completion

        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Model to use (default: bleu-chat-v1)
            temperature: Sampling temperature 0-2 (default: 0.7)
            max_tokens: Maximum tokens to generate
            **kwargs: Additional parameters

        Returns:
            ChatCompletionResponse object

        Example:
            response = client.chat([
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
        response_data = self._request(
            method="POST",
            endpoint=ENDPOINT_CHAT,
            data=request.model_dump(exclude_none=True),
        )
        return build_chat_response(response_data)

    def generate(
        self,
        prompt: str,
        model: str = DEFAULT_MODEL_GENERATE,
        temperature: float = 0.7,
        max_tokens: int = 256,
        **kwargs: Any,
    ) -> GenerationResponse:
        """
        Generate text from a prompt

        Args:
            prompt: The prompt to generate from
            model: Model to use (default: bleu-gen-v1)
            temperature: Sampling temperature 0-2 (default: 0.7)
            max_tokens: Maximum tokens to generate (default: 256)
            **kwargs: Additional parameters

        Returns:
            GenerationResponse object

        Example:
            response = client.generate("Once upon a time")
            print(response.text)
        """
        request = GenerationRequest(
            prompt=prompt,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs,
        )

        response_data = self._request(
            method="POST",
            endpoint=ENDPOINT_GENERATE,
            data=request.model_dump(exclude_none=True),
        )
        return build_generate_response(response_data)

    def embed(
        self,
        texts: List[str],
        model: str = DEFAULT_MODEL_EMBED,
        **kwargs: Any,
    ) -> EmbeddingResponse:
        """
        Create embeddings for texts

        Args:
            texts: List of texts to embed (max 100)
            model: Model to use (default: bleu-embed-v1)
            **kwargs: Additional parameters

        Returns:
            EmbeddingResponse object

        Example:
            response = client.embed(["Hello world", "Goodbye world"])
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

        response_data = self._request(
            method="POST",
            endpoint=ENDPOINT_EMBED,
            data=request.model_dump(exclude_none=True),
        )
        return build_embed_response(response_data)

    def health(self) -> Dict[str, Any]:
        """
        Check API health (GET /health).

        Returns:
            Health response dict (e.g. status, version). Use when the backend
            exposes GET /health per the API contract. On failure (e.g. 404),
            raises; callers can fall back to list_models() for connectivity check.
        """
        return self._request(method="GET", endpoint=ENDPOINT_HEALTH)

    def list_models(self) -> List[Model]:
        """
        List available models

        Returns:
            List of Model objects

        Example:
            models = client.list_models()
            for model in models:
                print(f"{model.id}: {model.description}")
        """
        response_data = self._request(
            method="GET",
            endpoint=ENDPOINT_MODELS,
        )

        model_list = ModelListResponse(**response_data)
        return model_list.data

    def close(self) -> None:
        """Close the HTTP client. Prefer using ``with BleuAPIClient(...) as client:``."""
        self._client.close()

    def __enter__(self) -> "BleuAPIClient":
        """Context manager entry. Prefer: ``with BleuAPIClient(api_key="...") as client:``"""
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Context manager exit."""
        self.close()

    def __del__(self) -> None:
        """Best-effort cleanup on GC. Prefer explicit close() or context manager."""
        try:
            if getattr(self, "_client", None) is not None and httpx is not None:
                self._client.close()
        except Exception:
            pass
