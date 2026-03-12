"""
Tests for AsyncBleuAPIClient (async API client).
"""

import os
from unittest.mock import AsyncMock, Mock, patch

import pytest

try:
    import httpx

    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False

try:
    from bleujs.api_client import (
        AsyncBleuAPIClient,
        AuthenticationError,
        ChatCompletionResponse,
        EmbeddingResponse,
        GenerationResponse,
    )

    ASYNC_CLIENT_AVAILABLE = True
except ImportError:
    ASYNC_CLIENT_AVAILABLE = False


@pytest.fixture
def mock_api_key():
    """Test API key."""
    return "bleujs_sk_test_async"


@pytest.fixture
def async_client(mock_api_key):
    """AsyncBleuAPIClient instance."""
    if not HTTPX_AVAILABLE or not ASYNC_CLIENT_AVAILABLE:
        pytest.skip("httpx or AsyncBleuAPIClient not available")
    return AsyncBleuAPIClient(api_key=mock_api_key)


class TestAsyncClientInit:
    """Test async client initialization."""

    @pytest.mark.asyncio
    async def test_async_client_without_key_raises(self):
        """AsyncBleuAPIClient() without API key raises AuthenticationError."""
        if not ASYNC_CLIENT_AVAILABLE:
            pytest.skip("AsyncBleuAPIClient not available")
        old = os.environ.pop("BLEUJS_API_KEY", None)
        try:
            with pytest.raises(AuthenticationError):
                AsyncBleuAPIClient()
        finally:
            if old is not None:
                os.environ["BLEUJS_API_KEY"] = old

    def test_async_client_with_key(self, mock_api_key):
        """AsyncBleuAPIClient with key has correct base_url."""
        if not ASYNC_CLIENT_AVAILABLE:
            pytest.skip("AsyncBleuAPIClient not available")
        client = AsyncBleuAPIClient(api_key=mock_api_key)
        assert client.api_key == mock_api_key
        assert client.base_url == AsyncBleuAPIClient.DEFAULT_BASE_URL


class TestAsyncChat:
    """Test async chat completion."""

    @pytest.mark.asyncio
    @patch("httpx.AsyncClient.request", new_callable=AsyncMock)
    async def test_async_chat_returns_response(self, mock_request, async_client):
        """Async chat returns ChatCompletionResponse."""
        mock_request.return_value = Mock(
            status_code=200,
            json=lambda: {
                "id": "chat-1",
                "object": "chat.completion",
                "created": 1234567890,
                "model": "bleu-chat-v1",
                "choices": [{"message": {"role": "assistant", "content": "Hi!"}}],
            },
        )
        response = await async_client.chat([{"role": "user", "content": "Hello"}])
        assert isinstance(response, ChatCompletionResponse)
        assert response.content == "Hi!"


class TestAsyncHealth:
    """Test async health()."""

    @pytest.mark.asyncio
    @patch("httpx.AsyncClient.request", new_callable=AsyncMock)
    async def test_async_health_returns_dict(self, mock_request, async_client):
        """Async health() returns dict."""
        mock_request.return_value = Mock(
            status_code=200,
            json=lambda: {"status": "ok", "version": "1.4.0"},
        )
        result = await async_client.health()
        assert isinstance(result, dict)
        assert result.get("status") == "ok"
