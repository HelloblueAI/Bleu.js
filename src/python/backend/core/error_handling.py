"""
Advanced error handling system for the backend.
"""

import asyncio
import time
import traceback
from dataclasses import dataclass
from datetime import datetime
from functools import wraps
from typing import Any, Callable, Dict, Optional, Type, TypeVar

import sentry_sdk
import structlog
from fastapi import HTTPException, Request

logger = structlog.get_logger()

T = TypeVar("T")


@dataclass
class ErrorContext:
    """Error context data."""

    timestamp: datetime
    request_id: str
    endpoint: str
    method: str
    params: Dict[str, Any]
    headers: Dict[str, str]
    body: Optional[str]
    error_type: str
    error_message: str
    traceback: str
    user_id: Optional[str] = None


class BaseAPIException(Exception):
    """Base exception for API errors."""

    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class ValidationError(BaseAPIException):
    """Validation error."""

    def __init__(self, message: str):
        super().__init__(message, status_code=400)


class AuthenticationError(BaseAPIException):
    """Authentication error."""

    def __init__(self, message: str):
        super().__init__(message, status_code=401)


class AuthorizationError(BaseAPIException):
    """Authorization error."""

    def __init__(self, message: str):
        super().__init__(message, status_code=403)


class ResourceNotFoundError(BaseAPIException):
    """Resource not found error."""

    def __init__(self, message: str):
        super().__init__(message, status_code=404)


class RateLimitError(BaseAPIException):
    """Rate limit error."""

    def __init__(self, message: str):
        super().__init__(message, status_code=429)


class ServiceUnavailableError(BaseAPIException):
    """Service unavailable error."""

    def __init__(self, message: str):
        super().__init__(message, status_code=503)


class ErrorHandler:
    """Advanced error handling system."""

    def __init__(self, config: Dict[str, Any]):
        """Initialize error handler."""
        self.config = config
        self._setup_sentry()
        self.error_stats: Dict[str, Any] = {
            "total_errors": 0,
            "error_counts": {},
            "latest_error": None,
        }
        self.circuit_breakers: Dict[str, Dict[str, Any]] = {}

    def _setup_sentry(self):
        """Setup Sentry integration."""
        if self.config.get("sentry_dsn"):
            sentry_sdk.init(
                dsn=self.config["sentry_dsn"],
                environment=self.config.get("environment", "production"),
                traces_sample_rate=1.0,
            )

    async def _create_error_context(
        self, request: Request, error: Exception
    ) -> ErrorContext:
        """Create error context from request and error."""
        # Get request body if available
        body = None
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.json()
            except BaseException:
                pass

        # Create error context
        return ErrorContext(
            timestamp=datetime.utcnow(),
            request_id=request.headers.get("x-request-id", ""),
            endpoint=str(request.url.path),
            method=request.method,
            params=dict(request.query_params),
            headers=dict(request.headers),
            body=body,
            error_type=error.__class__.__name__,
            error_message=str(error),
            traceback=traceback.format_exc(),
            user_id=getattr(request.state, "user_id", None),
        )

    def error_handler(
        self, error_type: Type[Exception]
    ) -> Callable[[Callable[..., T]], Callable[..., T]]:
        """Decorator for handling specific error types."""

        def decorator(func: Callable[..., T]) -> Callable[..., T]:
            @wraps(func)
            async def wrapper(*args, **kwargs):
                try:
                    return await func(*args, **kwargs)
                except error_type as e:
                    # Get request object
                    request = next(
                        (arg for arg in args if isinstance(arg, Request)), None
                    )

                    if request:
                        # Create error context
                        context = await self._create_error_context(request, e)

                        # Log error with context
                        logger.error(
                            "request_error",
                            error_type=context.error_type,
                            error_message=context.error_message,
                            request_id=context.request_id,
                            endpoint=context.endpoint,
                            method=context.method,
                        )

                        # Update error stats
                        self._update_error_stats(context)

                        # Send to Sentry if configured
                        if self.config.get("sentry_dsn"):
                            sentry_sdk.capture_exception(e)

                    # Raise HTTP exception
                    if isinstance(e, BaseAPIException):
                        raise HTTPException(
                            status_code=e.status_code,
                            detail={
                                "code": e.__class__.__name__.upper(),
                                "message": e.message,
                            },
                        )
                    raise HTTPException(status_code=500)

            return wrapper

        return decorator

    def retry_on_error(
        self,
        max_retries: int = 3,
        delay: float = 1.0,
        backoff_factor: float = 2.0,
        exceptions: tuple = (Exception,),
    ) -> Callable[[Callable[..., T]], Callable[..., T]]:
        """Decorator for retrying operations on error."""

        def decorator(func: Callable[..., T]) -> Callable[..., T]:
            @wraps(func)
            async def wrapper(*args, **kwargs):
                last_error = None
                delay_time = delay

                for attempt in range(max_retries):
                    try:
                        return await func(*args, **kwargs)
                    except exceptions as e:
                        last_error = e
                        if attempt < max_retries - 1:
                            await asyncio.sleep(delay_time)
                            delay_time *= backoff_factor
                            logger.warning(
                                "retry_attempt",
                                attempt=attempt + 1,
                                max_retries=max_retries,
                                error=str(e),
                            )

                # If we get here, all retries failed
                raise last_error

            return wrapper

        return decorator

    def circuit_breaker(
        self, failure_threshold: int = 5, reset_timeout: float = 60.0
    ) -> Callable[[Callable[..., T]], Callable[..., T]]:
        """Decorator implementing the circuit breaker pattern."""

        def decorator(func: Callable[..., T]) -> Callable[..., T]:
            circuit_name = func.__name__

            # Initialize circuit breaker state
            if circuit_name not in self.circuit_breakers:
                self.circuit_breakers[circuit_name] = {
                    "failures": 0,
                    "last_failure": 0,
                    "state": "closed",  # closed, open, or half-open
                }

            @wraps(func)
            async def wrapper(*args, **kwargs):
                circuit = self.circuit_breakers[circuit_name]

                # Check if circuit is open
                if circuit["state"] == "open":
                    if time.time() - circuit["last_failure"] > reset_timeout:
                        # Try to move to half-open state
                        circuit["state"] = "half-open"
                        logger.info("circuit_half_open", circuit=circuit_name)
                    else:
                        raise ServiceUnavailableError("Service temporarily unavailable")

                try:
                    result = await func(*args, **kwargs)

                    # Success in half-open state closes the circuit
                    if circuit["state"] == "half-open":
                        circuit["state"] = "closed"
                        circuit["failures"] = 0
                        logger.info("circuit_closed", circuit=circuit_name)

                    return result

                except Exception as e:
                    # Update failure count and timestamp
                    circuit["failures"] += 1
                    circuit["last_failure"] = time.time()

                    # Check if we should open the circuit
                    if circuit["failures"] >= failure_threshold:
                        circuit["state"] = "open"
                        logger.warning(
                            "circuit_opened",
                            circuit=circuit_name,
                            failures=circuit["failures"],
                        )

                    raise e

            return wrapper

        return decorator

    def _update_error_stats(self, context: ErrorContext):
        """Update error statistics."""
        self.error_stats["total_errors"] += 1
        self.error_stats["error_counts"][context.error_type] = (
            self.error_stats["error_counts"].get(context.error_type, 0) + 1
        )
        self.error_stats["latest_error"] = {
            "type": context.error_type,
            "message": context.error_message,
            "timestamp": context.timestamp.isoformat(),
            "endpoint": context.endpoint,
        }

    async def get_error_stats(self) -> Dict[str, Any]:
        """Get error statistics."""
        return self.error_stats.copy()


# Create global error handler instance
error_handler = ErrorHandler(
    {
        "sentry_dsn": None,  # Configure in production
        "environment": "development",
        "debug": True,
    }
)
