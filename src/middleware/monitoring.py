"""Monitoring middleware implementation."""

import logging
import time
from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.base import BaseHTTPMiddleware
from prometheus_client import Counter, Histogram

from src.config import get_settings

# Metrics
REQUEST_COUNT = Counter(
    "http_requests_total", "Total number of HTTP requests", ["method", "path", "status"]
)

REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "path"],
)


class MonitoringMiddleware(BaseHTTPMiddleware):
    """Middleware for monitoring requests."""

    def __init__(self, app: FastAPI) -> None:
        """Initialize the monitoring middleware.

        Args:
            app: FastAPI application
        """
        super().__init__(app)
        self.settings = get_settings()
        self.logger = logging.getLogger(__name__)

    async def dispatch(self, request: Request, call_next: Any) -> Any:
        """Process request and collect metrics.

        Args:
            request: FastAPI request
            call_next: Next middleware or route handler

        Returns:
            Any: Response from next middleware or route handler
        """
        try:
            # Start timer
            start_time = time.time()

            # Get response from next middleware or route handler
            response = await call_next(request)

            # Calculate duration
            duration = time.time() - start_time

            # Update metrics
            REQUEST_COUNT.labels(
                method=request.method,
                path=request.url.path,
                status=response.status_code,
            ).inc()

            REQUEST_LATENCY.labels(
                method=request.method, path=request.url.path
            ).observe(duration)

            # Log request
            self.logger.info(
                f"{request.method} {request.url.path} {response.status_code}",
                extra={
                    "duration": duration,
                    "client": request.client.host if request.client else None,
                    "user_agent": request.headers.get("user-agent"),
                    "referer": request.headers.get("referer"),
                },
            )

            return response

        except Exception as e:
            # Calculate duration
            duration = time.time() - start_time

            # Update metrics
            REQUEST_COUNT.labels(
                method=request.method, path=request.url.path, status=500
            ).inc()

            REQUEST_LATENCY.labels(
                method=request.method, path=request.url.path
            ).observe(duration)

            # Log error
            self.logger.error(
                f"Failed to process request: {str(e)}",
                exc_info=True,
                extra={
                    "path": request.url.path,
                    "method": request.method,
                    "duration": duration,
                    "client": request.client.host if request.client else None,
                    "user_agent": request.headers.get("user-agent"),
                    "referer": request.headers.get("referer"),
                },
            )
            raise
