"""
API configuration settings.
"""

from pydantic import BaseSettings, Field


class APIConfig(BaseSettings):
    """API configuration settings."""

    # Public API. Set BLEUJS_API_KEY in the environment for a real key.
    base_url: str = Field(
        default="https://api.bleujs.org",
        description="Base URL for the API",
    )
    api_key: str = Field(
        default="",
        description="API key for authentication",
    )

    aws_region: str = Field(default="us-east-1", description="AWS region")
    aws_profile: str = Field(default="", description="AWS profile name")

    # API endpoints
    endpoints = {"root": "/api", "predict": "/api/ai/predict", "health": "/health"}

    # Request settings
    timeout: int = Field(default=30, description="Request timeout in seconds")
    max_retries: int = Field(default=3, description="Maximum number of retry attempts")
    retry_delay: int = Field(default=1, description="Delay between retries in seconds")


# Create global config instance
api_config = APIConfig()
