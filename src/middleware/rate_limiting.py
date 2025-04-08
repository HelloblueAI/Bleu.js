"""Rate limiting middleware module."""

from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from src.services.rate_limiting import RateLimitingService


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Middleware for rate limiting requests."""

    def __init__(
        self,
        app: FastAPI,
        rate_limiting_service: RateLimitingService,
        max_requests: int = 100,
        window_seconds: int = 60,
        exclude_paths: Optional[list[str]] = None,
    ) -> None:
        """Initialize rate limiting middleware.

        Args:
            app: FastAPI application
            rate_limiting_service: Rate limiting service
            max_requests: Maximum number of requests per window (default: 100)
            window_seconds: Window size in seconds (default: 60)
            exclude_paths: List of paths to exclude from rate limiting (optional)
        """
        super().__init__(app)
        self.rate_limiting_service = rate_limiting_service
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.exclude_paths = exclude_paths or []

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """Process request through rate limiting middleware.

        Args:
            request: Request object
            call_next: Next middleware/endpoint in chain

        Returns:
            Response: Response object

        Raises:
            HTTPException: If rate limit is exceeded
        """
        # Skip rate limiting for excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)

        # Get client identifier (IP address or API key)
        client_id = self._get_client_id(request)

        # Check rate limit
        if not await self.rate_limiting_service.check_rate_limit(
            client_id=client_id,
            max_requests=self.max_requests,
            window_seconds=self.window_seconds,
        ):
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please try again later.",
            )

        # Process request
        response = await call_next(request)

        # Add rate limit headers
        remaining = await self.rate_limiting_service.get_remaining_requests(
            client_id=client_id,
            max_requests=self.max_requests,
            window_seconds=self.window_seconds,
        )
        reset_time = await self.rate_limiting_service.get_window_reset_time(
            client_id=client_id,
            window_seconds=self.window_seconds,
        )

        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset_time)

        return response

    def _get_client_id(self, request: Request) -> str:
        """Get client identifier from request.

        Args:
            request: Request object

        Returns:
            str: Client identifier
        """
        # Try to get API key from header
        api_key = request.headers.get("X-API-Key")
        if api_key:
            return f"api_key:{api_key}"

        # Fall back to client IP
        client_ip = request.client.host if request.client else "unknown"
        return f"ip:{client_ip}"
