"""Error handling middleware implementation."""

import logging

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import Counter

from src.config import get_settings

# Metrics
ERROR_COUNT = Counter(
    "http_errors_total", "Total number of HTTP errors", ["status_code", "path"]
)


class ErrorHandler:
    """Middleware for handling errors and exceptions."""

    def __init__(self, app: FastAPI) -> None:
        """Initialize the error handler.

        Args:
            app: FastAPI application
        """
        self.app = app
        self.settings = get_settings()
        self.logger = logging.getLogger(__name__)

        # Add CORS middleware
        app.add_middleware(
            CORSMiddleware,
            allow_origins=self.settings.CORS_ORIGINS,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        # Add error handlers
        app.add_exception_handler(Exception, self.handle_exception)
        app.add_exception_handler(404, self.handle_not_found)
        app.add_exception_handler(422, self.handle_validation_error)
        app.add_exception_handler(500, self.handle_server_error)

    async def handle_exception(self, request: Request, exc: Exception) -> JSONResponse:
        """Handle general exceptions.

        Args:
            request: FastAPI request
            exc: Exception object

        Returns:
            JSONResponse: Error response
        """
        self.logger.error(
            f"Unhandled exception: {str(exc)}",
            exc_info=True,
            extra={
                "path": request.url.path,
                "method": request.method,
                "client": request.client.host if request.client else None,
            },
        )

        ERROR_COUNT.labels(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, path=request.url.path
        ).inc()

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Internal server error",
                "message": "An unexpected error occurred",
            },
        )

    async def handle_not_found(self, request: Request, exc: Exception) -> JSONResponse:
        """Handle 404 Not Found errors.

        Args:
            request: FastAPI request
            exc: Exception object

        Returns:
            JSONResponse: Error response
        """
        self.logger.warning(
            f"Not found: {request.url.path}",
            extra={
                "method": request.method,
                "client": request.client.host if request.client else None,
            },
        )

        ERROR_COUNT.labels(
            status_code=status.HTTP_404_NOT_FOUND, path=request.url.path
        ).inc()

        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "error": "Not found",
                "message": f"The requested resource {request.url.path} was not found",
            },
        )

    async def handle_validation_error(
        self, request: Request, exc: Exception
    ) -> JSONResponse:
        """Handle 422 Validation Error.

        Args:
            request: FastAPI request
            exc: Exception object

        Returns:
            JSONResponse: Error response
        """
        self.logger.warning(
            f"Validation error: {str(exc)}",
            extra={
                "path": request.url.path,
                "method": request.method,
                "client": request.client.host if request.client else None,
            },
        )

        ERROR_COUNT.labels(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, path=request.url.path
        ).inc()

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"error": "Validation error", "message": str(exc)},
        )

    async def handle_server_error(
        self, request: Request, exc: Exception
    ) -> JSONResponse:
        """Handle 500 Server Error.

        Args:
            request: FastAPI request
            exc: Exception object

        Returns:
            JSONResponse: Error response
        """
        self.logger.error(
            f"Server error: {str(exc)}",
            exc_info=True,
            extra={
                "path": request.url.path,
                "method": request.method,
                "client": request.client.host if request.client else None,
            },
        )

        ERROR_COUNT.labels(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, path=request.url.path
        ).inc()

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Server error",
                "message": "An internal server error occurred",
            },
        )
