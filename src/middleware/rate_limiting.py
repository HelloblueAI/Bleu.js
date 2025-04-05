from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from src.services.rate_limiting_service import rate_limiter


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Middleware to apply rate limiting to routes."""

    def __init__(
        self,
        app: ASGIApp,
        exempt_paths: list[str] = None,
        exempt_methods: list[str] = None,
    ):
        super().__init__(app)
        self.exempt_paths = exempt_paths or []
        self.exempt_methods = exempt_methods or ["OPTIONS"]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting for exempt paths and methods
        if (
            request.url.path in self.exempt_paths
            or request.method in self.exempt_methods
        ):
            return await call_next(request)

        # Get user ID from request (you may need to adjust this based on your auth setup)
        user_id = request.headers.get("X-User-ID", "anonymous")

        # Get subscription plan from request (you may need to adjust this based on your auth setup)
        plan = request.headers.get("X-Subscription-Plan", "free")

        try:
            # Check rate limit
            await rate_limiter.check_rate_limit(user_id, plan)

            # Process request
            response = await call_next(request)

            # Add rate limit headers to response
            status = await rate_limiter.get_rate_limit_status(user_id)
            response.headers["X-RateLimit-Limit"] = str(status["remaining"])
            response.headers["X-RateLimit-Reset"] = str(int(status["reset"]))

            return response

        except Exception as e:
            # If rate limit is exceeded, return 429
            if hasattr(e, "status_code") and e.status_code == 429:
                return Response(
                    content="Rate limit exceeded",
                    status_code=429,
                    headers={
                        "Retry-After": "60",
                        "X-RateLimit-Limit": "0",
                        "X-RateLimit-Reset": "60",
                    },
                )
            raise
