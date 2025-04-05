"""Rate limiting middleware implementation."""

import logging
from typing import Any

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import Counter

from src.config import get_settings
from src.services.rate_limiting_service import RateLimitingService

# Metrics
RATE_LIMIT_EXCEEDED = Counter(
    "rate_limit_exceeded_total",
    "Total number of rate limit exceeded requests",
    ["path"],
)


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """Middleware for rate limiting requests."""

    def __init__(self, app: FastAPI, rate_limiter: RateLimitingService) -> None:
        """Initialize the rate limiter middleware.

        Args:
            app: FastAPI application
            rate_limiter: Rate limiting service
        """
        super().__init__(app)
        self.rate_limiter = rate_limiter
        self.settings = get_settings()
        self.logger = logging.getLogger(__name__)

    async def dispatch(self, request: Request, call_next: Any) -> Any:
        """Process request and apply rate limiting.

        Args:
            request: FastAPI request
            call_next: Next middleware or route handler

        Returns:
            Any: Response from next middleware or route handler

        Raises:
            HTTPException: If rate limit is exceeded
        """
        try:
            # Get client IP
            client_ip = request.client.host if request.client else "unknown"

            # Get rate limit key
            key = f"{client_ip}:{request.url.path}"

            # Check rate limit
            is_allowed, rate_limit_info = await self.rate_limiter.check_rate_limit(
                key=key,
                limit=self.settings.RATE_LIMIT,
                window=self.settings.RATE_LIMIT_WINDOW,
            )

            if not is_allowed:
                # Update metrics
                RATE_LIMIT_EXCEEDED.labels(path=request.url.path).inc()

                # Log warning
                self.logger.warning(
                    f"Rate limit exceeded for {client_ip}",
                    extra={
                        "path": request.url.path,
                        "method": request.method,
                        "limit": rate_limit_info["limit"],
                        "remaining": rate_limit_info["remaining"],
                        "reset": rate_limit_info["reset"],
                    },
                )

                # Return error response
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "error": "Too many requests",
                        "message": "Rate limit exceeded",
                        "retry_after": rate_limit_info["reset"],
                    },
                    headers={
                        "Retry-After": str(rate_limit_info["reset"]),
                        "X-RateLimit-Limit": str(rate_limit_info["limit"]),
                        "X-RateLimit-Remaining": str(rate_limit_info["remaining"]),
                        "X-RateLimit-Reset": str(rate_limit_info["reset"]),
                    },
                )

            # Get response from next middleware or route handler
            response = await call_next(request)

            # Add rate limit headers to response
            response.headers["X-RateLimit-Limit"] = str(rate_limit_info["limit"])
            response.headers["X-RateLimit-Remaining"] = str(
                rate_limit_info["remaining"]
            )
            response.headers["X-RateLimit-Reset"] = str(rate_limit_info["reset"])

            return response

        except Exception as e:
            self.logger.error(
                f"Failed to process rate limit: {str(e)}",
                exc_info=True,
                extra={
                    "path": request.url.path,
                    "method": request.method,
                    "client": client_ip,
                },
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process rate limit",
            )
