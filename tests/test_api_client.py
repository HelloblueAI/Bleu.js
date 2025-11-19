"""
Tests for Bleu.js API Client
"""

import pytest
import os
from unittest.mock import Mock, patch, MagicMock

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False

from bleujs.api_client import (
    BleuAPIClient,
    BleuAPIError,
    AuthenticationError,
    RateLimitError,
    InvalidRequestError,
    APIError,
    NetworkError,
    ValidationError,
)
from bleujs.api_client import (
    ChatMessage,
    ChatCompletionResponse,
    GenerationResponse,
    EmbeddingResponse,
    Model,
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
    
    @patch('httpx.Client.request')
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
                            "content": "Hello! How can I help?"
                        },
                        "finish_reason": "stop"
                    }
                ]
            }
        )
        
        response = client.chat([
            {"role": "user", "content": "Hello!"}
        ])
        
        assert isinstance(response, ChatCompletionResponse)
        assert response.model == "bleu-chat-v1"
        assert response.content == "Hello! How can I help?"
    
    @patch('httpx.Client.request')
    def test_chat_with_system_message(self, mock_request, client):
        """Test chat with system message"""
        mock_request.return_value = Mock(
            status_code=200,
            json=lambda: {
                "id": "chat-123",
                "object": "chat.completion",
                "created": 1234567890,
                "model": "bleu-chat-v1",
                "choices": [{"message": {"role": "assistant", "content": "Yes!"}}]
            }
        )
        
        response = client.chat([
            {"role": "system", "content": "You are helpful."},
            {"role": "user", "content": "Hello!"}
        ])
        
        assert isinstance(response, ChatCompletionResponse)
    
    def test_chat_empty_message_content(self, client):
        """Test chat with empty message content raises error"""
        with pytest.raises(Exception):  # Pydantic validation error
            client.chat([
                {"role": "user", "content": ""}
            ])


class TestTextGeneration:
    """Test text generation functionality"""
    
    @patch('httpx.Client.request')
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
                "finish_reason": "stop"
            }
        )
        
        response = client.generate("Once upon a time")
        
        assert isinstance(response, GenerationResponse)
        assert response.model == "bleu-gen-v1"
        assert response.text.startswith("Once upon a time")
    
    @patch('httpx.Client.request')
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
                    "total_tokens": 25
                }
            }
        )
        
        response = client.generate(
            "Test prompt",
            temperature=0.9,
            max_tokens=100
        )
        
        assert isinstance(response, GenerationResponse)
        assert response.usage is not None


class TestEmbeddings:
    """Test embeddings functionality"""
    
    @patch('httpx.Client.request')
    def test_embed_basic(self, mock_request, client):
        """Test basic embeddings"""
        mock_request.return_value = Mock(
            status_code=200,
            json=lambda: {
                "object": "list",
                "model": "bleu-embed-v1",
                "data": [
                    {"embedding": [0.1, 0.2, 0.3], "index": 0},
                    {"embedding": [0.4, 0.5, 0.6], "index": 1}
                ]
            }
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


class TestModels:
    """Test model listing functionality"""
    
    @patch('httpx.Client.request')
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
                        "description": "Chat model"
                    },
                    {
                        "id": "bleu-gen-v1",
                        "object": "model",
                        "created": 1234567890,
                        "owned_by": "bleujs",
                        "capabilities": ["generation"],
                        "description": "Generation model"
                    }
                ]
            }
        )
        
        models = client.list_models()
        
        assert isinstance(models, list)
        assert len(models) == 2
        assert all(isinstance(m, Model) for m in models)
        assert models[0].id == "bleu-chat-v1"


class TestErrorHandling:
    """Test error handling"""
    
    @patch('httpx.Client.request')
    def test_authentication_error(self, mock_request, client):
        """Test authentication error (401)"""
        mock_request.return_value = Mock(
            status_code=401,
            json=lambda: {
                "error": {"message": "Invalid API key"}
            }
        )
        
        with pytest.raises(AuthenticationError) as exc:
            client.chat([{"role": "user", "content": "Hello"}])
        assert "Invalid API key" in str(exc.value)
    
    @patch('httpx.Client.request')
    def test_rate_limit_error(self, mock_request, client):
        """Test rate limit error (429)"""
        mock_request.return_value = Mock(
            status_code=429,
            json=lambda: {
                "error": {"message": "Rate limit exceeded"}
            }
        )
        
        with pytest.raises(RateLimitError):
            client.chat([{"role": "user", "content": "Hello"}])
    
    @patch('httpx.Client.request')
    def test_invalid_request_error(self, mock_request, client):
        """Test invalid request error (400)"""
        mock_request.return_value = Mock(
            status_code=400,
            json=lambda: {
                "error": {"message": "Invalid request"}
            }
        )
        
        with pytest.raises(InvalidRequestError):
            client.chat([{"role": "user", "content": "Hello"}])
    
    @patch('httpx.Client.request')
    def test_server_error(self, mock_request, client):
        """Test server error (500)"""
        mock_request.return_value = Mock(
            status_code=500,
            json=lambda: {
                "error": {"message": "Internal server error"}
            }
        )
        
        with pytest.raises(APIError):
            client.chat([{"role": "user", "content": "Hello"}])
    
    @patch('httpx.Client.request')
    def test_network_timeout(self, mock_request, client):
        """Test network timeout with retry"""
        mock_request.side_effect = httpx.TimeoutException("Request timeout")
        
        with pytest.raises(NetworkError):
            client.chat([{"role": "user", "content": "Hello"}])


class TestRequestRetry:
    """Test request retry logic"""
    
    @patch('httpx.Client.request')
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
                    "choices": [{"message": {"role": "assistant", "content": "Hi"}}]
                }
            )
        ]
        
        response = client.chat([{"role": "user", "content": "Hello"}])
        assert isinstance(response, ChatCompletionResponse)
        assert mock_request.call_count == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

