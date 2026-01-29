"""CSRF protection middleware implementation."""

from typing import Any, Optional

from fastapi import FastAPI


class CSRFMiddleware:
    """Placeholder CSRF middleware (use setup_csrf_protection for setup)."""

    def __init__(self, app: Optional[FastAPI] = None, secret_key: Optional[str] = None):
        self.app = app
        self.secret_key = secret_key or "csrf-secret"

    def __call__(self, request: Any, call_next: Any) -> Any:
        return call_next(request)


def setup_csrf_protection(app: FastAPI, secret_key: Optional[str] = None) -> None:
    """Setup CSRF protection middleware for FastAPI app.

    Args:
        app: FastAPI application
        secret_key: Optional CSRF secret (for tests).
    """
    # Basic CSRF protection setup - placeholder implementation
    pass
