"""
API configuration settings.
"""

from pydantic import BaseSettings, Field


class APIConfig(BaseSettings):
    """API configuration settings."""

    # AWS API Gateway settings
    base_url: str = Field(
        default="https://mozxitsnsh.execute-api.us-west-2.amazonaws.com/prod",
        description="Base URL for the API",
    )
    api_key: str = Field(
        default="JeF8N9VobS6OlgTFiAuba99hRX47e70R9b5ivnBR",
        description="API key for authentication",
    )

    # AWS SSO settings
    aws_region: str = Field(default="us-west-2", description="AWS region")
    aws_profile: str = Field(default="Bleujs-SSO", description="AWS SSO profile name")

    # API endpoints
    endpoints = {"root": "/api", "predict": "/api/ai/predict", "health": "/health"}

    # Request settings
    timeout: int = Field(default=30, description="Request timeout in seconds")
    max_retries: int = Field(default=3, description="Maximum number of retry attempts")
    retry_delay: int = Field(default=1, description="Delay between retries in seconds")


# Create global config instance
api_config = APIConfig()
