"""Authentication middleware implementation."""

import logging
from typing import Any

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import Counter

from src.config import get_settings
from src.services.auth_service import AuthService

# Constants
INVALID_AUTH_SCHEME = "Invalid authorization scheme"

# Metrics
AUTH_FAILURE = Counter(
    "auth_failure_total", "Total number of authentication failures", ["path", "reason"]
)


class AuthMiddleware(BaseHTTPMiddleware):
    """Middleware for authentication."""

    def __init__(self, app: FastAPI, auth_service: AuthService) -> None:
        """Initialize the authentication middleware.

        Args:
            app: FastAPI application
            auth_service: Authentication service
        """
        super().__init__(app)
        self.auth_service = auth_service
        self.settings = get_settings()
        self.logger = logging.getLogger(__name__)

    async def dispatch(self, request: Request, call_next: Any) -> Any:
        """Process request and apply authentication.

        Args:
            request: FastAPI request
            call_next: Next middleware or route handler

        Returns:
            Any: Response from next middleware or route handler

        Raises:
            HTTPException: If authentication fails
        """
        try:
            # Skip authentication for public endpoints
            if request.url.path in self.settings.PUBLIC_ENDPOINTS:
                return await call_next(request)

            # Get authorization header
            auth_header = request.headers.get("Authorization")
            if not auth_header:
                # Update metrics
                AUTH_FAILURE.labels(path=request.url.path, reason="missing_token").inc()

                # Log warning
                self.logger.warning(
                    "Authorization header missing",
                    extra={
                        "path": request.url.path,
                        "method": request.method,
                        "client": request.client.host if request.client else None,
                    },
                )

                # Return error response
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={
                        "error": "Unauthorized",
                        "message": "Authorization header missing",
                    },
                    headers={"WWW-Authenticate": "Bearer"},
                )

            # Get token from header
            try:
                scheme, token = auth_header.split()
                if scheme.lower() != "bearer":
                    raise ValueError(INVALID_AUTH_SCHEME)
            except ValueError:
                # Update metrics
                AUTH_FAILURE.labels(
                    path=request.url.path, reason="invalid_scheme"
                ).inc()

                # Log warning
                self.logger.warning(
                    INVALID_AUTH_SCHEME,
                    extra={
                        "path": request.url.path,
                        "method": request.method,
                        "client": request.client.host if request.client else None,
                    },
                )

                # Return error response
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"error": "Unauthorized", "message": INVALID_AUTH_SCHEME},
                    headers={"WWW-Authenticate": "Bearer"},
                )

            # Verify token and get user
            try:
                user = await self.auth_service.get_current_user(token)
                request.state.user = user
            except HTTPException as e:
                # Update metrics
                AUTH_FAILURE.labels(path=request.url.path, reason="invalid_token").inc()

                # Log warning
                self.logger.warning(
                    f"Token validation failed: {str(e)}",
                    extra={
                        "path": request.url.path,
                        "method": request.method,
                        "client": request.client.host if request.client else None,
                    },
                )

                # Return error response
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"error": "Unauthorized", "message": str(e.detail)},
                    headers={"WWW-Authenticate": "Bearer"},
                )

            # Get response from next middleware or route handler
            response = await call_next(request)

            return response

        except Exception as e:
            self.logger.error(
                f"Failed to process authentication: {str(e)}",
                exc_info=True,
                extra={
                    "path": request.url.path,
                    "method": request.method,
                    "client": request.client.host if request.client else None,
                },
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process authentication",
            )
