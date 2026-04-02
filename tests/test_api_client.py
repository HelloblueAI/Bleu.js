"""
Tests for Bleu.js API Client
"""

import os
from unittest.mock import MagicMock, Mock, patch

import pytest

try:
    import httpx

    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False

from bleujs.api_client import (
    APIError,
    AuthenticationError,
    BleuAPIClient,
    BleuAPIError,
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatMessage,
    EmbeddingResponse,
    GenerationResponse,
    InvalidRequestError,
    Model,
    NetworkError,
    RateLimitError,
    ValidationError,
)


@pytest.fixture
def mock_api_key():
    """Provide a mock API key"""
    return "bleujs_sk_test_12345"


@pytest.fixture
def client(mock_api_key):
    """Create a test client"""
    if not HTTPX_AVAILABLE:
        pytest.skip("httpx not installed")
    return BleuAPIClient(api_key=mock_api_key)


@pytest.fixture
def mock_response():
    """Create a mock HTTP response"""
    response = Mock()
    response.status_code = 200
    response.json.return_value = {}
    return response


class TestClientInitialization:
    """Test client initialization"""

    def test_client_with_api_key(self, mock_api_key):
        """Test creating client with API key"""
        if not HTTPX_AVAILABLE:
            pytest.skip("httpx not installed")
        client = BleuAPIClient(api_key=mock_api_key)
        assert client.api_key == mock_api_key
        assert client.base_url == BleuAPIClient.DEFAULT_BASE_URL

    def test_client_without_api_key(self):
        """Test creating client without API key raises error"""
        if not HTTPX_AVAILABLE:
            pytest.skip("httpx not installed")
        # Clear env var
        old_key = os.environ.get("BLEUJS_API_KEY")
        if "BLEUJS_API_KEY" in os.environ:
            del os.environ["BLEUJS_API_KEY"]

        with pytest.raises(AuthenticationError):
            BleuAPIClient()

        # Restore env var
        if old_key:
            os.environ["BLEUJS_API_KEY"] = old_key

    def test_client_with_custom_base_url(self, mock_api_key):
        """Test creating client with custom base URL"""
        if not HTTPX_AVAILABLE:
            pytest.skip("httpx not installed")
        custom_url = "https://custom.api.com"
        client = BleuAPIClient(api_key=mock_api_key, base_url=custom_url)
        assert client.base_url == custom_url

    def test_client_context_manager(self, mock_api_key):
        """Test using client as context manager"""
        if not HTTPX_AVAILABLE:
            pytest.skip("httpx not installed")
        with BleuAPIClient(api_key=mock_api_key) as client:
            assert client.api_key == mock_api_key


class TestChatCompletion:
    """Test chat completion functionality"""

    @patch("httpx.Client.request")
    def test_chat_basic(self, mock_request, client):
        """Test basic chat completion"""
        # Mock response
        mock_request.return_value = Mock(
            status_code=200,
            json=lambda: {
                "id": "chat-123",
                "object": "chat.completion",
                "created": 1234567890,
                "model": "bleu-chat-v1",
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": "Hello! How can I help?",
                        },
                        "finish_reason": "stop",
                    }
                ],
            },
        )

        response = client.chat([{"role": "user", "content": "Hello!"}])

        assert isinstance(response, ChatCompletionResponse)
        assert response.model == "bleu-chat-v1"
        assert response.content == "Hello! How can I help?"

    @patch("httpx.Client.request")
    def test_chat_with_system_message(self, mock_request, client):
        """Test chat with system message"""
        mock_request.return_value = Mock(
            status_code=200,
            json=lambda: {
                "id": "chat-123",
                "object": "chat.completion",
                "created": 1234567890,
                "model": "bleu-chat-v1",
                "choices": [{"message": {"role": "assistant", "content": "Yes!"}}],
            },
        )

        response = client.chat(
            [
                {"role": "system", "content": "You are helpful."},
                {"role": "user", "content": "Hello!"},
            ]
        )

        assert isinstance(response, ChatCompletionResponse)

    @patch("httpx.Client.request")
    def test_chat_session_seed_goal_in_request_body(self, mock_request, client):
        """session_seed_goal is sent in JSON when provided (first-turn onboarding hint)."""
        mock_request.return_value = Mock(
            status_code=200,
            json=lambda: {
                "id": "c1",
                "object": "chat.completion",
                "created": 0,
                "model": "bleu-chat-v1",
                "choices": [{"message": {"role": "assistant", "content": "ok"}}],
            },
        )
        client.chat(
            [{"role": "user", "content": "Hello"}],
            session_seed_goal="Learn the dashboard",
        )
        call_kw = mock_request.call_args.kwargs
        assert call_kw.get("json", {}).get("session_seed_goal") == "Learn the dashboard"

    def test_chat_session_seed_goal_too_long(self, client):
        """Pydantic rejects session_seed_goal longer than 500 characters."""
        long_goal = "x" * 501
        with pytest.raises(Exception):
            client.chat(
                [{"role": "user", "content": "Hi"}],
                session_seed_goal=long_goal,
            )

    def test_chat_completion_request_session_seed_goal_max_length(self):
        """ChatCompletionRequest accepts exactly 500 chars for session_seed_goal."""
        goal = "y" * 500
        req = ChatCompletionRequest(
            messages=[ChatMessage(role="user", content="hi")],
            session_seed_goal=goal,
        )
        assert req.session_seed_goal == goal

    def test_chat_empty_message_content(self, client):
        """Test chat with empty message content raises error"""
        with pytest.raises(Exception):  # Pydantic validation error
            client.chat([{"role": "user", "content": ""}])

    @patch("httpx.Client.request")
    def test_chat_flat_content_response(self, mock_request, client):
        """Test chat when API returns flat { content: '...' } (no choices)."""
        mock_request.return_value = Mock(
            status_code=200,
            json=lambda: {"content": "Hello from flat API!"},
        )
        response = client.chat([{"role": "user", "content": "Hi"}])
        assert isinstance(response, ChatCompletionResponse)
        assert response.content == "Hello from flat API!"

    @patch("httpx.Client.request")
    def test_chat_response_none(self, mock_request, client):
        """Test chat when API returns null/empty body (normalized to empty content)."""
        mock_request.return_value = Mock(status_code=200, json=lambda: None)
        response = client.chat([{"role": "user", "content": "Hi"}])
        assert isinstance(response, ChatCompletionResponse)
        assert response.content == ""

    @patch("httpx.Client.request")
    def test_chat_choices_as_strings(self, mock_request, client):
        """Test chat when API returns choices as list of strings (no message dict)."""
        mock_request.return_value = Mock(
            status_code=200,
            json=lambda: {
                "id": "c1",
                "created": 0,
                "model": "bleu-chat-v1",
                "choices": ["Reply as plain string"],
            },
        )
        response = client.chat([{"role": "user", "content": "Hi"}])
        assert isinstance(response, ChatCompletionResponse)
        assert response.content == "Reply as plain string"

    @patch("httpx.Client.request")
    def test_chat_choice_message_as_string(self, mock_request, client):
        """Test chat when API returns choices[].message as a string (not dict)."""
        mock_request.return_value = Mock(
            status_code=200,
            json=lambda: {
                "id": "c1",
                "created": 0,
                "model": "bleu-chat-v1",
                "choices": [{"message": "Hello from string message"}],
            },
        )
        response = client.chat([{"role": "user", "content": "Hi"}])
        assert isinstance(response, ChatCompletionResponse)
        assert response.content == "Hello from string message"


class TestTextGeneration:
    """Test text generation functionality"""

    @patch("httpx.Client.request")
    def test_generate_basic(self, mock_request, client):
        """Test basic text generation"""
        mock_request.return_value = Mock(
            status_code=200,
            json=lambda: {
                "id": "gen-123",
                "object": "text.completion",
                "created": 1234567890,
                "model": "bleu-gen-v1",
                "text": "Once upon a time in a land far away...",
                "finish_reason": "stop",
            },
        )

        response = client.generate("Once upon a time")

        assert isinstance(response, GenerationResponse)
        assert response.model == "bleu-gen-v1"
        assert response.text.startswith("Once upon a time")

    @patch("httpx.Client.request")
    def test_generate_with_options(self, mock_request, client):
        """Test generation with custom options"""
        mock_request.return_value = Mock(
            status_code=200,
            json=lambda: {
                "id": "gen-123",
                "object": "text.completion",
                "created": 1234567890,
                "model": "bleu-gen-v1",
                "text": "Generated text",
                "usage": {
                    "prompt_tokens": 5,
                    "completion_tokens": 20,
                    "total_tokens": 25,
                },
            },
        )

        response = client.generate("Test prompt", temperature=0.9, max_tokens=100)

        assert isinstance(response, GenerationResponse)
        assert response.usage is not None

    @patch("httpx.Client.request")
    def test_generate_plain_string_response(self, mock_request, client):
        """Test generate when API returns a plain string body."""
        mock_request.return_value = Mock(
            status_code=200,
            json=lambda: "Just the generated text",
        )
        response = client.generate("Prompt")
        assert isinstance(response, GenerationResponse)
        assert response.text == "Just the generated text"


class TestEmbeddings:
    """Test embeddings functionality"""

    @patch("httpx.Client.request")
    def test_embed_basic(self, mock_request, client):
        """Test basic embeddings"""
        mock_request.return_value = Mock(
            status_code=200,
            json=lambda: {
                "object": "list",
                "model": "bleu-embed-v1",
                "data": [
                    {"embedding": [0.1, 0.2, 0.3], "index": 0},
                    {"embedding": [0.4, 0.5, 0.6], "index": 1},
                ],
            },
        )

        response = client.embed(["Hello", "World"])

        assert isinstance(response, EmbeddingResponse)
        assert len(response.embeddings) == 2
        assert response.embeddings[0] == [0.1, 0.2, 0.3]

    def test_embed_empty_list(self, client):
        """Test embedding empty list raises error"""
        with pytest.raises(ValidationError):
            client.embed([])

    def test_embed_too_many_texts(self, client):
        """Test embedding too many texts raises error"""
        with pytest.raises(ValidationError):
            client.embed(["text"] * 101)

    @patch("httpx.Client.request")
    def test_embed_data_as_raw_vectors(self, mock_request, client):
        """Test embed when API returns data as list of raw vectors (no embedding key)."""
        mock_request.return_value = Mock(
            status_code=200,
            json=lambda: {
                "object": "list",
                "model": "bleu-embed-v1",
                "data": [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]],
            },
        )
        response = client.embed(["Hello", "World"])
        assert isinstance(response, EmbeddingResponse)
        assert len(response.embeddings) == 2
        assert response.embeddings[0] == [0.1, 0.2, 0.3]
        assert response.embeddings[1] == [0.4, 0.5, 0.6]

    @patch("httpx.Client.request")
    def test_embed_data_null_or_missing(self, mock_request, client):
        """Test embed when API returns null or missing data."""
        mock_request.return_value = Mock(
            status_code=200,
            json=lambda: {"object": "list", "model": "bleu-embed-v1", "data": None},
        )
        response = client.embed(["Hello"])
        assert isinstance(response, EmbeddingResponse)
        assert response.embeddings == []


class TestModels:
    """Test model listing functionality"""

    @patch("httpx.Client.request")
    def test_list_models(self, mock_request, client):
        """Test listing available models"""
        mock_request.return_value = Mock(
            status_code=200,
            json=lambda: {
                "object": "list",
                "data": [
                    {
                        "id": "bleu-chat-v1",
                        "object": "model",
                        "created": 1234567890,
                        "owned_by": "bleujs",
                        "capabilities": ["chat", "completion"],
                        "description": "Chat model",
                    },
                    {
                        "id": "bleu-gen-v1",
                        "object": "model",
                        "created": 1234567890,
                        "owned_by": "bleujs",
                        "capabilities": ["generation"],
                        "description": "Generation model",
                    },
                ],
            },
        )

        models = client.list_models()

        assert isinstance(models, list)
        assert len(models) == 2
        assert all(isinstance(m, Model) for m in models)
        assert models[0].id == "bleu-chat-v1"


class TestErrorHandling:
    """Test error handling"""

    @patch("httpx.Client.request")
    def test_authentication_error(self, mock_request, client):
        """Test authentication error (401)"""
        mock_request.return_value = Mock(
            status_code=401, json=lambda: {"error": {"message": "Invalid API key"}}
        )

        with pytest.raises(AuthenticationError) as exc:
            client.chat([{"role": "user", "content": "Hello"}])
        assert "Invalid API key" in str(exc.value)

    @patch("httpx.Client.request")
    def test_rate_limit_error(self, mock_request, client):
        """Test rate limit error (429)"""
        mock_request.return_value = Mock(
            status_code=429, json=lambda: {"error": {"message": "Rate limit exceeded"}}
        )

        with pytest.raises(RateLimitError):
            client.chat([{"role": "user", "content": "Hello"}])

    @patch("httpx.Client.request")
    def test_rate_limit_error_includes_retry_after_when_header_present(
        self, mock_request, client
    ):
        """Test that 429 response with Retry-After header sets retry_after on exception."""
        resp = Mock(
            status_code=429,
            json=lambda: {"error": {"message": "Too many requests"}},
            headers={"retry-after": "10"},
        )
        mock_request.return_value = resp
        with pytest.raises(RateLimitError) as exc:
            client.chat([{"role": "user", "content": "Hi"}])
        assert exc.value.retry_after == 10.0

    @patch("httpx.Client.request")
    @patch("time.sleep")
    def test_429_retry_then_success(self, mock_sleep, mock_request, mock_api_key):
        """Test that client retries on 429 and succeeds on next attempt (best-in-market)."""
        if not HTTPX_AVAILABLE:
            pytest.skip("httpx not installed")
        client = BleuAPIClient(api_key=mock_api_key, retry_on_rate_limit=True)
        mock_request.side_effect = [
            Mock(
                status_code=429,
                json=lambda: {"error": {"message": "Rate limited"}},
                headers={},
            ),
            Mock(
                status_code=200,
                json=lambda: {
                    "id": "c1",
                    "created": 0,
                    "model": "bleu-chat-v1",
                    "choices": [
                        {"message": {"role": "assistant", "content": "Hi back!"}}
                    ],
                },
            ),
        ]
        response = client.chat([{"role": "user", "content": "Hi"}])
        assert response.content == "Hi back!"
        assert mock_request.call_count == 2
        mock_sleep.assert_called_once()

    @patch("httpx.Client.request")
    def test_invalid_request_error(self, mock_request, client):
        """Test invalid request error (400)"""
        mock_request.return_value = Mock(
            status_code=400, json=lambda: {"error": {"message": "Invalid request"}}
        )

        with pytest.raises(InvalidRequestError):
            client.chat([{"role": "user", "content": "Hello"}])

    @patch("httpx.Client.request")
    def test_server_error(self, mock_request, client):
        """Test server error (500)"""
        mock_request.return_value = Mock(
            status_code=500,
            json=lambda: {"error": {"message": "Internal server error"}},
        )

        with pytest.raises(APIError):
            client.chat([{"role": "user", "content": "Hello"}])

    @patch("httpx.Client.request")
    def test_error_response_body_as_string(self, mock_request, client):
        """Test that non-dict error body (e.g. plain string) is handled without .get() crash."""
        mock_request.return_value = Mock(
            status_code=401,
            json=lambda: "Unauthorized",
        )
        with pytest.raises(AuthenticationError) as exc:
            client.chat([{"role": "user", "content": "Hello"}])
        assert "Unauthorized" in str(exc.value)

    @patch("httpx.Client.request")
    def test_error_response_fastapi_detail_surfaced(self, mock_request, client):
        """Test that FastAPI-style { \"detail\": \"...\" } is shown instead of 'Unknown error'."""
        mock_request.return_value = Mock(
            status_code=400,
            json=lambda: {"detail": "Invalid model name"},
        )
        with pytest.raises(InvalidRequestError) as exc:
            client.chat([{"role": "user", "content": "Hi"}])
        assert "Invalid model name" in str(exc.value)
        assert "Unknown error" not in str(exc.value)

    @patch("httpx.Client.request")
    def test_network_timeout(self, mock_request, client):
        """Test network timeout with retry"""
        mock_request.side_effect = httpx.TimeoutException("Request timeout")

        with pytest.raises(NetworkError):
            client.chat([{"role": "user", "content": "Hello"}])


class TestRequestRetry:
    """Test request retry logic"""

    @patch("httpx.Client.request")
    def test_retry_on_timeout(self, mock_request, client):
        """Test retry on timeout error"""
        # First call fails, second succeeds
        mock_request.side_effect = [
            httpx.TimeoutException("Timeout"),
            Mock(
                status_code=200,
                json=lambda: {
                    "id": "chat-123",
                    "object": "chat.completion",
                    "created": 1234567890,
                    "model": "bleu-chat-v1",
                    "choices": [{"message": {"role": "assistant", "content": "Hi"}}],
                },
            ),
        ]

        response = client.chat([{"role": "user", "content": "Hello"}])
        assert isinstance(response, ChatCompletionResponse)
        assert mock_request.call_count == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
