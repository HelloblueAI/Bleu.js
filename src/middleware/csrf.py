"""CSRF protection middleware (double-submit cookie pattern)."""

import hmac
import secrets
from typing import Any, Optional

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

CSRF_COOKIE_NAME = "csrf_token"
CSRF_HEADER_NAME = "X-CSRF-Token"
SAFE_METHODS = frozenset({"GET", "HEAD", "OPTIONS", "TRACE"})


def _constant_time_compare(a: str, b: str) -> bool:
    """Constant-time string comparison to prevent timing attacks."""
    return hmac.compare_digest(a.encode("utf-8"), b.encode("utf-8"))


class CSRFMiddleware:
    """CSRF middleware: validates X-CSRF-Token header against cookie for state-changing requests."""

    def __init__(
        self,
        app: FastAPI,
        secret_key: Optional[str] = None,
        cookie_name: str = CSRF_COOKIE_NAME,
        header_name: str = CSRF_HEADER_NAME,
    ):
        self.app = app
        self.secret_key = (secret_key or "csrf-secret").encode("utf-8")
        self.cookie_name = cookie_name
        self.header_name = header_name

    async def __call__(self, request: Request, call_next: Any) -> Any:
        if request.method in SAFE_METHODS:
            return await call_next(request)

        cookie_token = request.cookies.get(self.cookie_name)
        header_token = request.headers.get(self.header_name)

        if not cookie_token or not header_token:
            return JSONResponse(
                status_code=403,
                content={"detail": "CSRF token missing"},
            )
        if not _constant_time_compare(cookie_token, header_token):
            return JSONResponse(
                status_code=403,
                content={"detail": "Invalid CSRF token"},
            )

        return await call_next(request)


def setup_csrf_protection(app: FastAPI, secret_key: Optional[str] = None) -> None:
    """Setup CSRF protection: middleware + token endpoint.

    - For POST/PUT/PATCH/DELETE, validates X-CSRF-Token header against csrf_token cookie.
    - Add GET /api/v1/csrf-token to your app to issue a token and set the cookie (call before forms).
    """
    sk = secret_key or "csrf-secret"
    app.add_middleware(
        CSRFMiddleware,
        secret_key=sk,
        cookie_name=CSRF_COOKIE_NAME,
        header_name=CSRF_HEADER_NAME,
    )

    @app.get("/api/v1/csrf-token")
    async def get_csrf_token(request: Request):
        """Issue a CSRF token and set it in a cookie. Frontend should send it in X-CSRF-Token."""
        token = secrets.token_urlsafe(32)
        response = JSONResponse(content={"csrf_token": token})
        response.set_cookie(
            key=CSRF_COOKIE_NAME,
            value=token,
            max_age=3600,
            samesite="lax",
            httponly=False,
        )
        return response
