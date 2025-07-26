"""Redis configuration."""

from typing import Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


class RedisConfig(BaseModel):
    """Redis configuration."""

    host: str = "localhost"
    port: int = Field(default=6379, ge=1, le=65535)
    db: int = Field(default=0, ge=0, le=15)
    password: Optional[str] = None
    ssl: bool = False
    encoding: str = "utf-8"
    decode_responses: bool = True
    socket_timeout: int = Field(default=5, gt=0)
    socket_connect_timeout: int = Field(default=5, gt=0)
    socket_keepalive: bool = True
    socket_keepalive_options: Optional[Dict] = None
    connection_pool: Optional[Dict] = None
    unix_socket_path: Optional[str] = None
    retry_on_timeout: bool = True
    max_connections: int = Field(default=10, gt=0)
    health_check_interval: int = Field(default=30, gt=0)

    # Rate limiting settings
    rate_limit_window: int = Field(default=60, gt=0)  # seconds
    rate_limit_max_requests: int = Field(default=100, gt=0)  # requests per window
    rate_limit_key_prefix: str = "rate_limit:"

    # Cache settings
    cache_ttl: int = Field(default=300, gt=0)  # seconds

    model_config = ConfigDict(arbitrary_types_allowed=True)

    def get_connection_url(self) -> str:
        """Get Redis connection URL."""
        auth = f":{self.password}@" if self.password else ""
        protocol = "rediss" if self.ssl else "redis"
        return f"{protocol}://{auth}{self.host}:{self.port}/{self.db}"
