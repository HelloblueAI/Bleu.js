"""Rate limiting configuration."""

from pydantic import BaseModel, ConfigDict


class RateLimitingConfig(BaseModel):
    """Rate limiting configuration."""

    enabled: bool = True
    rate_limit: int = 100  # requests per second
    burst_limit: int = 200  # maximum burst size
    window_size: int = 60  # window size in seconds
    key_prefix: str = "rate_limit:"  # Redis key prefix
    algorithm: str = "fixed_window"  # Rate limiting algorithm to use
    error_code: int = 429  # HTTP status code for rate limit exceeded
    error_message: str = "Rate limit exceeded. Please try again later."

    model_config = ConfigDict(arbitrary_types_allowed=True)
