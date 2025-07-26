"""Rate limiting configuration."""

from pydantic import BaseModel, ConfigDict, Field


class RateLimitingConfig(BaseModel):
    """Rate limiting configuration."""

    enabled: bool = True
    rate_limit: int = Field(default=100, gt=0)  # requests per second
    burst_limit: int = Field(default=200, gt=0)  # maximum burst size
    window_size: int = Field(default=60, gt=0)  # window size in seconds
    key_prefix: str = "rate_limit:"  # Redis key prefix
    algorithm: str = Field(
        default="fixed_window",
        pattern="^(fixed_window|sliding_window|token_bucket|leaky_bucket)$",
    )
    error_code: int = Field(
        default=429, ge=400, le=599
    )  # HTTP status code for rate limit exceeded
    error_message: str = "Rate limit exceeded. Please try again later."

    model_config = ConfigDict(arbitrary_types_allowed=True)
