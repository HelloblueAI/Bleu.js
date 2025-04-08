"""Redis configuration."""

from typing import Dict, Optional

from pydantic import BaseModel, ConfigDict


class RedisConfig(BaseModel):
    """Redis configuration."""

    host: str = "localhost"
    port: int = 6379
    db: int = 0
    password: Optional[str] = None
    ssl: bool = False
    encoding: str = "utf-8"
    decode_responses: bool = True
    socket_timeout: int = 5
    socket_connect_timeout: int = 5
    socket_keepalive: bool = True
    socket_keepalive_options: Optional[Dict] = None
    connection_pool: Optional[Dict] = None
    unix_socket_path: Optional[str] = None
    retry_on_timeout: bool = True
    max_connections: int = 10
    health_check_interval: int = 30

    # Rate limiting settings
    rate_limit_window: int = 60  # seconds
    rate_limit_max_requests: int = 100  # requests per window
    rate_limit_key_prefix: str = "rate_limit:"

    # Cache settings
    cache_ttl: int = 300  # seconds

    model_config = ConfigDict(arbitrary_types_allowed=True)

    def get_connection_url(self) -> str:
        """Get Redis connection URL."""
        auth = f":{self.password}@" if self.password else ""
        protocol = "rediss" if self.ssl else "redis"
        return f"{protocol}://{auth}{self.host}:{self.port}/{self.db}"
