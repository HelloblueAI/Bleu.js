"""Secrets manager configuration."""

from typing import Optional

from pydantic import BaseModel, ConfigDict


class SecretsManagerConfig(BaseModel):
    """Secrets manager configuration."""

    region_name: str = "us-east-1"
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_session_token: Optional[str] = None
    endpoint_url: Optional[str] = None
    use_ssl: bool = True
    verify: bool = True
    timeout: int = 5
    max_retries: int = 3
    secret_name_prefix: str = "bleujs/"
    cache_ttl: int = 300  # Cache TTL in seconds
    enable_caching: bool = True
    enable_encryption: bool = True
    encryption_key: Optional[str] = None

    model_config = ConfigDict(arbitrary_types_allowed=True)
