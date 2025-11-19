"""
Data models for Bleu.js API Client

These models use Pydantic for validation and serialization.
"""

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, field_validator


class ChatMessage(BaseModel):
    """A single message in a chat conversation"""
    
    role: Literal["system", "user", "assistant"] = Field(
        ...,
        description="The role of the message sender"
    )
    content: str = Field(
        ...,
        description="The content of the message"
    )
    name: Optional[str] = Field(
        None,
        description="Optional name of the message sender"
    )
    
    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Message content cannot be empty")
        return v


class ChatCompletionRequest(BaseModel):
    """Request body for chat completion endpoint"""
    
    messages: List[ChatMessage] = Field(
        ...,
        description="List of messages in the conversation",
        min_length=1
    )
    model: str = Field(
        default="bleu-chat-v1",
        description="Model to use for completion"
    )
    temperature: float = Field(
        default=0.7,
        ge=0.0,
        le=2.0,
        description="Sampling temperature"
    )
    max_tokens: Optional[int] = Field(
        default=None,
        ge=1,
        description="Maximum tokens to generate"
    )
    top_p: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Nucleus sampling parameter"
    )
    stream: bool = Field(
        default=False,
        description="Whether to stream the response"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional metadata"
    )


class ChatCompletionResponse(BaseModel):
    """Response from chat completion endpoint"""
    
    id: str = Field(..., description="Unique completion ID")
    object: str = Field(default="chat.completion")
    created: int = Field(..., description="Unix timestamp")
    model: str = Field(..., description="Model used")
    choices: List[Dict[str, Any]] = Field(..., description="Completion choices")
    usage: Optional[Dict[str, int]] = Field(None, description="Token usage stats")
    
    @property
    def content(self) -> str:
        """Get the content of the first choice"""
        if self.choices:
            return self.choices[0].get("message", {}).get("content", "")
        return ""


class GenerationRequest(BaseModel):
    """Request body for text generation endpoint"""
    
    prompt: str = Field(
        ...,
        description="The prompt to generate from",
        min_length=1
    )
    model: str = Field(
        default="bleu-gen-v1",
        description="Model to use for generation"
    )
    temperature: float = Field(
        default=0.7,
        ge=0.0,
        le=2.0,
        description="Sampling temperature"
    )
    max_tokens: int = Field(
        default=256,
        ge=1,
        le=4096,
        description="Maximum tokens to generate"
    )
    top_p: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Nucleus sampling parameter"
    )
    top_k: int = Field(
        default=50,
        ge=0,
        description="Top-k sampling parameter"
    )
    stop: Optional[List[str]] = Field(
        default=None,
        description="Stop sequences"
    )


class GenerationResponse(BaseModel):
    """Response from text generation endpoint"""
    
    id: str = Field(..., description="Unique generation ID")
    object: str = Field(default="text.completion")
    created: int = Field(..., description="Unix timestamp")
    model: str = Field(..., description="Model used")
    text: str = Field(..., description="Generated text")
    usage: Optional[Dict[str, int]] = Field(None, description="Token usage stats")
    finish_reason: Optional[str] = Field(None, description="Why generation stopped")


class EmbeddingRequest(BaseModel):
    """Request body for embeddings endpoint"""
    
    input: List[str] = Field(
        ...,
        description="List of texts to embed",
        min_length=1,
        max_length=100
    )
    model: str = Field(
        default="bleu-embed-v1",
        description="Model to use for embeddings"
    )
    encoding_format: Literal["float", "base64"] = Field(
        default="float",
        description="Format of the embeddings"
    )
    
    @field_validator("input")
    @classmethod
    def validate_input(cls, v: List[str]) -> List[str]:
        for text in v:
            if not text or not text.strip():
                raise ValueError("Empty strings are not allowed in input")
        return v


class EmbeddingResponse(BaseModel):
    """Response from embeddings endpoint"""
    
    object: str = Field(default="list")
    data: List[Dict[str, Any]] = Field(..., description="List of embeddings")
    model: str = Field(..., description="Model used")
    usage: Optional[Dict[str, int]] = Field(None, description="Token usage stats")
    
    @property
    def embeddings(self) -> List[List[float]]:
        """Get embeddings as list of float vectors"""
        return [item.get("embedding", []) for item in self.data]


class Model(BaseModel):
    """Model information"""
    
    id: str = Field(..., description="Model identifier")
    object: str = Field(default="model")
    created: int = Field(..., description="Unix timestamp when created")
    owned_by: str = Field(..., description="Organization that owns the model")
    capabilities: List[str] = Field(
        default_factory=list,
        description="List of capabilities"
    )
    description: Optional[str] = Field(None, description="Model description")
    context_length: Optional[int] = Field(None, description="Maximum context length")


class ModelListResponse(BaseModel):
    """Response from models list endpoint"""
    
    object: str = Field(default="list")
    data: List[Model] = Field(..., description="List of available models")


class UsageStats(BaseModel):
    """Token usage statistics"""
    
    prompt_tokens: int = Field(default=0, description="Tokens in prompt")
    completion_tokens: int = Field(default=0, description="Tokens in completion")
    total_tokens: int = Field(default=0, description="Total tokens used")

