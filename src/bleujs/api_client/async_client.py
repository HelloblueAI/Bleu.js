"""
Asynchronous client for Bleu.js API

This module provides an async HTTP client for interacting with
the Bleu.js cloud API at https://bleujs.org
"""

import os
import asyncio
from typing import List, Dict, Any, Optional
from urllib.parse import urljoin
import json

try:
    import httpx
except ImportError:
    httpx = None

from .exceptions import (
    BleuAPIError,
    AuthenticationError,
    NetworkError,
    ValidationError,
    parse_api_error,
)
from .models import (
    ChatMessage,
    ChatCompletionRequest,
    ChatCompletionResponse,
    GenerationRequest,
    GenerationResponse,
    EmbeddingRequest,
    EmbeddingResponse,
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
        base_url: Base URL for API (default: https://bleujs.org)
        timeout: Request timeout in seconds (default: 60)
        max_retries: Maximum number of retries for failed requests (default: 3)
    """
    
    DEFAULT_BASE_URL = "https://bleujs.org"
    DEFAULT_TIMEOUT = 60.0
    DEFAULT_MAX_RETRIES = 3
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: float = DEFAULT_TIMEOUT,
        max_retries: int = DEFAULT_MAX_RETRIES,
    ):
        if httpx is None:
            raise ImportError(
                "httpx is required for API client. Install with: pip install bleu-js[api]"
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
        
        self._client = httpx.AsyncClient(
            timeout=self.timeout,
            headers=self._get_headers(),
        )
    
    def _get_headers(self) -> Dict[str, str]:
        """Get HTTP headers for requests"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "bleu-js-python/1.2.1",
        }
    
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
                
                # Handle successful response
                if response.status_code == 200:
                    return response.json()
                
                # Handle error responses
                try:
                    error_data = response.json()
                except json.JSONDecodeError:
                    error_data = {"error": {"message": response.text}}
                
                raise parse_api_error(response.status_code, error_data)
            
            except httpx.TimeoutException as e:
                last_error = NetworkError(f"Request timeout: {str(e)}")
            except httpx.NetworkError as e:
                last_error = NetworkError(f"Network error: {str(e)}")
            except BleuAPIError:
                # Re-raise API errors immediately (don't retry)
                raise
            
            # Exponential backoff
            if attempt < self.max_retries - 1:
                await asyncio.sleep(2 ** attempt)
        
        # All retries failed
        if last_error:
            raise last_error
        raise NetworkError("Request failed after all retries")
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: str = "bleu-chat-v1",
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
            endpoint="/api/v1/chat",
            data=request.dict(exclude_none=True),
        )
        
        return ChatCompletionResponse(**response_data)
    
    async def generate(
        self,
        prompt: str,
        model: str = "bleu-gen-v1",
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
            endpoint="/api/v1/generate",
            data=request.dict(exclude_none=True),
        )
        
        return GenerationResponse(**response_data)
    
    async def embed(
        self,
        texts: List[str],
        model: str = "bleu-embed-v1",
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
            endpoint="/api/v1/embed",
            data=request.dict(exclude_none=True),
        )
        
        return EmbeddingResponse(**response_data)
    
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
            endpoint="/api/v1/models",
        )
        
        model_list = ModelListResponse(**response_data)
        return model_list.data
    
    async def close(self):
        """Close the HTTP client"""
        await self._client.aclose()
    
    async def __aenter__(self):
        """Async context manager entry"""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close()
    
    def __del__(self):
        """Cleanup on deletion"""
        try:
            asyncio.create_task(self.close())
        except Exception:
            pass

