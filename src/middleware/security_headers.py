"""Security headers middleware implementation."""

import logging
from typing import Any, Dict

from fastapi import FastAPI, Request
from fastapi.middleware.base import BaseHTTPMiddleware
from fastapi.responses import Response

from src.config import get_settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware for adding security headers to responses."""

    def __init__(self, app: FastAPI) -> None:
        """Initialize the security headers middleware.

        Args:
            app: FastAPI application
        """
        super().__init__(app)
        self.settings = get_settings()
        self.logger = logging.getLogger(__name__)

        # Default security headers with enhanced security
        self.headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "no-referrer",
            "Cross-Origin-Embedder-Policy": "require-corp",
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Resource-Policy": "same-origin",
            "Permissions-Policy": (
                "accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), "
                "camera=(), cross-origin-isolated=(), display-capture=(), "
                "document-domain=(), encrypted-media=(), execution-while-not-rendered=(), "
                "execution-while-out-of-viewport=(), fullscreen=(), geolocation=(), "
                "gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), "
                "navigation-override=(), payment=(), picture-in-picture=(), "
                "publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), "
                "usb=(), web-share=(), xr-spatial-tracking=()"
            ),
            "Content-Security-Policy": (
                "default-src 'none'; "
                "script-src 'self'; "
                "style-src 'self'; "
                "img-src 'self'; "
                "font-src 'self'; "
                "connect-src 'self'; "
                "media-src 'self'; "
                "object-src 'none'; "
                "child-src 'none'; "
                "frame-ancestors 'none'; "
                "form-action 'self'; "
                "base-uri 'none'; "
                "manifest-src 'self'; "
                "upgrade-insecure-requests; "
                "block-all-mixed-content"
            ),
            "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
            "Cache-Control": "no-store, max-age=0",
            "Clear-Site-Data": '"*"',
            "Feature-Policy": "none",
            "X-Permitted-Cross-Domain-Policies": "none",
            "X-DNS-Prefetch-Control": "off",
        }

        # Add custom headers from settings with validation
        if self.settings.SECURITY_HEADERS:
            self._validate_custom_headers(self.settings.SECURITY_HEADERS)
            self.headers.update(self.settings.SECURITY_HEADERS)

    def _validate_custom_headers(self, headers: Dict[str, str]) -> None:
        """Validate custom security headers.

        Args:
            headers: Dictionary of custom headers to validate

        Raises:
            ValueError: If any header is invalid
        """
        allowed_headers = {
            "Content-Security-Policy",
            "X-Frame-Options",
            "X-Content-Type-Options",
            "X-XSS-Protection",
            "Strict-Transport-Security",
            "Referrer-Policy",
            "Permissions-Policy",
            "Feature-Policy",
            "Cross-Origin-Embedder-Policy",
            "Cross-Origin-Opener-Policy",
            "Cross-Origin-Resource-Policy",
            "Cache-Control",
            "Clear-Site-Data",
            "X-Permitted-Cross-Domain-Policies",
            "X-DNS-Prefetch-Control",
        }

        for header in headers:
            if header not in allowed_headers:
                raise ValueError(f"Invalid security header: {header}")
            if not isinstance(headers[header], str):
                raise ValueError(f"Header value must be string: {header}")

    async def dispatch(self, request: Request, call_next: Any) -> Response:
        """Add security headers to response.

        Args:
            request: FastAPI request
            call_next: Next middleware/endpoint

        Returns:
            Response with security headers
        """
        try:
            response = await call_next(request)

            # Add security headers
            for header, value in self.headers.items():
                response.headers[header] = value

            return response

        except Exception as e:
            self.logger.error(f"Error in security headers middleware: {str(e)}")
            raise
