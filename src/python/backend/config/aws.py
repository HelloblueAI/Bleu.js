"""
AWS configuration for API Gateway integration.
"""

from typing import Optional

from pydantic import BaseModel, Field


class AWSConfig(BaseModel):
    """AWS configuration settings."""

    region: str = Field(default="us-east-1", description="AWS region")
    api_gateway_id: str = Field(..., description="API Gateway ID")
    stage: str = Field(default="prod", description="API Gateway stage")
    authorizer_type: str = Field(
        default="JWT", description="API Gateway authorizer type"
    )
    authorizer_uri: Optional[str] = Field(None, description="Lambda authorizer URI")
    cors_origins: list[str] = Field(default=["*"], description="Allowed CORS origins")
    cors_headers: list[str] = Field(default=["*"], description="Allowed CORS headers")
    cors_methods: list[str] = Field(default=["*"], description="Allowed CORS methods")
    cors_max_age: int = Field(
        default=300, description="CORS preflight cache duration in seconds"
    )
    api_key_required: bool = Field(
        default=True, description="Whether API key is required"
    )
    throttling_rate_limit: int = Field(
        default=100, description="API Gateway throttling rate limit"
    )
    throttling_burst_limit: int = Field(
        default=50, description="API Gateway throttling burst limit"
    )
    cache_ttl: int = Field(default=300, description="API Gateway cache TTL in seconds")
    cache_key_parameters: list[str] = Field(
        default=["user_id"], description="Parameters to use for cache key"
    )
    integration_timeout: int = Field(
        default=29000, description="Integration timeout in milliseconds"
    )
    request_validator: Optional[str] = Field(None, description="Request validator name")
    request_models: dict[str, str] = Field(
        default_factory=dict, description="Request models for validation"
    )
    response_models: dict[str, str] = Field(
        default_factory=dict, description="Response models for validation"
    )
    binary_media_types: list[str] = Field(
        default=["*/*"], description="Binary media types supported"
    )
    endpoint_configuration: str = Field(
        default="REGIONAL", description="API Gateway endpoint configuration"
    )
    policy: Optional[str] = Field(None, description="API Gateway resource policy")
    tags: dict[str, str] = Field(default_factory=dict, description="Resource tags")
