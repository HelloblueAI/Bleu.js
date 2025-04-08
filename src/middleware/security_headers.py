"""Security headers middleware module."""

from typing import Dict, Optional

from fastapi import FastAPI
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeaders:
    """Security headers configuration."""

    def __init__(
        self,
        hsts: bool = True,
        hsts_max_age: int = 31536000,
        hsts_include_subdomains: bool = True,
        hsts_preload: bool = True,
        xframe_options: str = "DENY",
        xss_protection: str = "1; mode=block",
        content_security_policy: Optional[str] = None,
        content_type_options: str = "nosniff",
        referrer_policy: str = "strict-origin-when-cross-origin",
        permissions_policy: Optional[str] = None,
        cache_control: str = "no-store, no-cache, must-revalidate, proxy-revalidate",
    ) -> None:
        """Initialize security headers configuration.

        Args:
            hsts: Enable HSTS (default: True)
            hsts_max_age: HSTS max age in seconds (default: 31536000)
            hsts_include_subdomains: Include subdomains in HSTS (default: True)
            hsts_preload: Enable HSTS preload (default: True)
            xframe_options: X-Frame-Options header value (default: "DENY")
            xss_protection: X-XSS-Protection header value (default: "1; mode=block")
            content_security_policy: Content-Security-Policy header value (optional)
            content_type_options: X-Content-Type-Options header value (default: "nosniff")
            referrer_policy: Referrer-Policy header value (default: "strict-origin-when-cross-origin")
            permissions_policy: Permissions-Policy header value (optional)
            cache_control: Cache-Control header value (default: "no-store, no-cache, must-revalidate, proxy-revalidate")
        """
        self.hsts = hsts
        self.hsts_max_age = hsts_max_age
        self.hsts_include_subdomains = hsts_include_subdomains
        self.hsts_preload = hsts_preload
        self.xframe_options = xframe_options
        self.xss_protection = xss_protection
        self.content_security_policy = content_security_policy
        self.content_type_options = content_type_options
        self.referrer_policy = referrer_policy
        self.permissions_policy = permissions_policy
        self.cache_control = cache_control

    def get_headers(self) -> Dict[str, str]:
        """Get security headers.

        Returns:
            Dict[str, str]: Security headers
        """
        headers = {
            "X-Frame-Options": self.xframe_options,
            "X-XSS-Protection": self.xss_protection,
            "X-Content-Type-Options": self.content_type_options,
            "Referrer-Policy": self.referrer_policy,
            "Cache-Control": self.cache_control,
        }

        # Add HSTS header
        if self.hsts:
            hsts_value = f"max-age={self.hsts_max_age}"
            if self.hsts_include_subdomains:
                hsts_value += "; includeSubDomains"
            if self.hsts_preload:
                hsts_value += "; preload"
            headers["Strict-Transport-Security"] = hsts_value

        # Add optional headers
        if self.content_security_policy:
            headers["Content-Security-Policy"] = self.content_security_policy
        if self.permissions_policy:
            headers["Permissions-Policy"] = self.permissions_policy

        return headers


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware for adding security headers to responses."""

    def __init__(
        self,
        app: FastAPI,
        security_headers: Optional[SecurityHeaders] = None,
        exclude_paths: Optional[list[str]] = None,
    ) -> None:
        """Initialize security headers middleware.

        Args:
            app: FastAPI application
            security_headers: Security headers configuration (optional)
            exclude_paths: List of paths to exclude from security headers (optional)
        """
        super().__init__(app)
        self.security_headers = security_headers or SecurityHeaders()
        self.exclude_paths = exclude_paths or []

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """Process request through security headers middleware.

        Args:
            request: Request object
            call_next: Next middleware/endpoint in chain

        Returns:
            Response: Response object
        """
        # Process request
        response = await call_next(request)

        # Skip security headers for excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return response

        # Add security headers
        headers = self.security_headers.get_headers()
        for header_name, header_value in headers.items():
            response.headers[header_name] = header_value

        return response
