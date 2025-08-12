"""
Advanced error handling middleware with circuit breaker pattern,
request/response logging, and structured error responses.
"""

import json
import logging
import time
import traceback
from datetime import datetime, timezone
from typing import Dict, Optional

from fastapi import Request, Response, status
from fastapi.exceptions import HTTPException, RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from src.config import get_settings

# Configure structured logging
logger = logging.getLogger(__name__)


class CircuitBreaker:
    """Circuit breaker pattern implementation for external service calls."""

    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN

    def call(self, func, *args, **kwargs):
        """Execute function with circuit breaker protection."""
        if self.state == "OPEN":
            if self._should_attempt_reset():
                self.state = "HALF_OPEN"
                logger.info("Circuit breaker attempting reset to HALF_OPEN")
            else:
                raise Exception("Circuit breaker is OPEN - service unavailable")

        try:
            result = func(*args, **kwargs)
            if self.state == "HALF_OPEN":
                self.state = "CLOSED"
                self.failure_count = 0
                logger.info("Circuit breaker reset to CLOSED")
            return result

        except Exception as e:
            self._record_failure()
            raise e

    def _record_failure(self):
        """Record a failure and potentially open the circuit."""
        self.failure_count += 1
        self.last_failure_time = time.time()

        if self.failure_count >= self.failure_threshold:
            self.state = "OPEN"
            logger.warning(
                f"Circuit breaker opened after {self.failure_count} failures"
            )

    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt reset."""
        if self.last_failure_time is None:
            return True
        return time.time() - self.last_failure_time >= self.recovery_timeout


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Comprehensive error handling middleware."""

    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.settings = get_settings()
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}

    async def dispatch(self, request: Request, call_next):
        """Process request with comprehensive error handling."""
        start_time = time.time()
        request_id = self._generate_request_id()

        # Log request
        await self._log_request(request, request_id)

        try:
            # Process request
            response = await call_next(request)

            # Log response
            await self._log_response(response, request_id, start_time)

            return response

        except Exception as exc:
            # Handle different types of exceptions
            response = await self._handle_exception(
                exc, request, request_id, start_time
            )
            return response

    async def _log_request(self, request: Request, request_id: str):
        """Log incoming request details."""
        try:
            body = await self._get_request_body(request)
            log_data = {
                "request_id": request_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "method": request.method,
                "url": str(request.url),
                "headers": dict(request.headers),
                "client_ip": self._get_client_ip(request),
                "user_agent": request.headers.get("user-agent", ""),
                "body_size": len(body) if body else 0,
            }

            logger.info(f"Request received: {json.dumps(log_data, default=str)}")

        except Exception as e:
            logger.error(f"Failed to log request: {str(e)}")

    async def _log_response(
        self, response: Response, request_id: str, start_time: float
    ):
        """Log response details."""
        try:
            duration = time.time() - start_time
            log_data = {
                "request_id": request_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status_code": response.status_code,
                "duration_ms": round(duration * 1000, 2),
                "headers": dict(response.headers),
            }

            logger.info(f"Response sent: {json.dumps(log_data, default=str)}")

        except Exception as e:
            logger.error(f"Failed to log response: {str(e)}")

    async def _handle_exception(
        self, exc: Exception, request: Request, request_id: str, start_time: float
    ) -> JSONResponse:
        """Handle different types of exceptions and return appropriate responses."""
        duration = time.time() - start_time

        # Log the exception
        logger.error(
            f"Exception in request {request_id}: {str(exc)}",
            extra={
                "request_id": request_id,
                "url": str(request.url),
                "method": request.method,
                "duration_ms": round(duration * 1000, 2),
                "traceback": traceback.format_exc(),
            },
        )

        # Handle specific exception types
        if isinstance(exc, HTTPException):
            return await self._handle_http_exception(exc, request_id)
        elif isinstance(exc, RequestValidationError):
            return await self._handle_validation_error(exc, request_id)
        elif isinstance(exc, ValueError):
            return await self._handle_value_error(exc, request_id)
        else:
            return await self._handle_generic_error(exc, request_id)

    async def _handle_http_exception(
        self, exc: HTTPException, request_id: str
    ) -> JSONResponse:
        """Handle HTTP exceptions."""
        error_response = {
            "error": {
                "type": "HTTPException",
                "message": exc.detail,
                "status_code": exc.status_code,
                "request_id": request_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        }

        return JSONResponse(
            status_code=exc.status_code,
            content=error_response,
            headers={"X-Request-ID": request_id},
        )

    async def _handle_validation_error(
        self, exc: RequestValidationError, request_id: str
    ) -> JSONResponse:
        """Handle request validation errors."""
        error_response = {
            "error": {
                "type": "ValidationError",
                "message": "Request validation failed",
                "details": exc.errors(),
                "status_code": status.HTTP_422_UNPROCESSABLE_ENTITY,
                "request_id": request_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        }

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=error_response,
            headers={"X-Request-ID": request_id},
        )

    async def _handle_value_error(
        self, exc: ValueError, request_id: str
    ) -> JSONResponse:
        """Handle value errors."""
        error_response = {
            "error": {
                "type": "ValueError",
                "message": str(exc),
                "status_code": status.HTTP_400_BAD_REQUEST,
                "request_id": request_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        }

        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=error_response,
            headers={"X-Request-ID": request_id},
        )

    async def _handle_generic_error(
        self, exc: Exception, request_id: str
    ) -> JSONResponse:
        """Handle generic exceptions."""
        # Don't expose internal errors in production
        if self.settings.APP_ENV == "production":
            message = "Internal server error"
        else:
            message = str(exc)

        error_response = {
            "error": {
                "type": "InternalServerError",
                "message": message,
                "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
                "request_id": request_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        }

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response,
            headers={"X-Request-ID": request_id},
        )

    def _generate_request_id(self) -> str:
        """Generate unique request ID."""
        return f"req_{int(time.time() * 1000)}_{id(self)}"

    async def _get_request_body(self, request: Request) -> Optional[str]:
        """Safely get request body."""
        try:
            body = await request.body()
            return body.decode() if body else None
        except Exception:
            return None

    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def get_circuit_breaker(self, service_name: str) -> CircuitBreaker:
        """Get or create circuit breaker for a service."""
        if service_name not in self.circuit_breakers:
            self.circuit_breakers[service_name] = CircuitBreaker()
        return self.circuit_breakers[service_name]


class RateLimitExceeded(Exception):
    """Custom exception for rate limit exceeded."""

    pass


class ServiceUnavailable(Exception):
    """Custom exception for service unavailable."""

    pass
