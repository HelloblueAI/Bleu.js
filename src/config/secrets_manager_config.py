"""Secrets manager configuration."""

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class SecretsManagerConfig(BaseModel):
    """Secrets manager configuration."""

    region_name: str = Field(default="us-east-1", min_length=1)
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_session_token: Optional[str] = None
    endpoint_url: Optional[str] = None
    use_ssl: bool = True
    verify: bool = True
    timeout: int = Field(default=5, gt=0)
    max_retries: int = Field(default=3, ge=0)
    secret_name_prefix: str = Field(default="bleujs/", min_length=1)
    cache_ttl: int = Field(default=300, gt=0)  # Cache TTL in seconds
    enable_caching: bool = True
    enable_encryption: bool = True
    encryption_key: Optional[str] = None

    model_config = ConfigDict(arbitrary_types_allowed=True)
