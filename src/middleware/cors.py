"""CORS middleware implementation."""

import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from src.config import get_settings


class CorsMiddleware:
    """Middleware for handling CORS (Cross-Origin Resource Sharing)."""

    def __init__(self, app: FastAPI) -> None:
        """Initialize the CORS middleware.

        Args:
            app: FastAPI application
        """
        self.app = app
        self.settings = get_settings()
        self.logger = logging.getLogger(__name__)

        # Get CORS settings
        origins = self.settings.CORS_ORIGINS
        methods = self.settings.CORS_METHODS
        headers = self.settings.CORS_HEADERS
        credentials = self.settings.CORS_CREDENTIALS
        max_age = self.settings.CORS_MAX_AGE

        # Add CORS middleware
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_methods=methods,
            allow_headers=headers,
            allow_credentials=credentials,
            max_age=max_age,
        )

    async def process_request(self, request: Request, call_next: Any) -> Any:
        """Process request and handle CORS.

        Args:
            request: FastAPI request
            call_next: Next middleware or route handler

        Returns:
            Any: Response from next middleware or route handler
        """
        try:
            # Get response from next middleware or route handler
            response = await call_next(request)

            # Add CORS headers if not already present
            if "Access-Control-Allow-Origin" not in response.headers:
                origin = request.headers.get("origin")
                if origin in self.settings.CORS_ORIGINS:
                    response.headers["Access-Control-Allow-Origin"] = origin
                    response.headers["Access-Control-Allow-Credentials"] = "true"

            return response

        except Exception as e:
            self.logger.error(
                f"Failed to process CORS request: {str(e)}",
                exc_info=True,
                extra={
                    "path": request.url.path,
                    "method": request.method,
                    "client": request.client.host if request.client else None,
                    "origin": request.headers.get("origin"),
                },
            )
            raise
