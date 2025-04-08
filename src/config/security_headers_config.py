"""Security headers configuration."""

from pydantic import BaseModel, ConfigDict


class SecurityHeadersConfig(BaseModel):
    """Security headers configuration."""

    x_frame_options: str = "DENY"
    x_content_type_options: str = "nosniff"
    x_xss_protection: str = "1; mode=block"
    strict_transport_security: str = "max-age=31536000; includeSubDomains"
    content_security_policy: str = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "font-src 'self'; "
        "connect-src 'self'"
    )
    referrer_policy: str = "strict-origin-when-cross-origin"
    permissions_policy: str = (
        "accelerometer=(), "
        "camera=(), "
        "geolocation=(), "
        "gyroscope=(), "
        "magnetometer=(), "
        "microphone=(), "
        "payment=(), "
        "usb=()"
    )
    cross_origin_opener_policy: str = "same-origin"
    cross_origin_embedder_policy: str = "require-corp"
    cross_origin_resource_policy: str = "same-origin"

    model_config = ConfigDict(arbitrary_types_allowed=True)
