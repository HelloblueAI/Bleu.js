"""Logging configuration for Bleu.js."""

import os
import sys
from datetime import UTC, datetime
from typing import Any, Optional

import structlog


def configure_logger(
    level: str = "INFO",
    format: str = "json",
    output: str = "stdout",
    file_path: Optional[str] = None,
) -> structlog.BoundLogger:
    """
    Configure structured logging for Bleu.js.

    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        format: Output format (json, console)
        output: Output destination (stdout, stderr, file)
        file_path: Path to log file if output is 'file'

    Returns:
        Configured logger instance
    """
    # Set up basic configuration
    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            (
                structlog.processors.JSONRenderer()
                if format == "json"
                else structlog.dev.ConsoleRenderer()
            ),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(structlog, level.upper())
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Configure output
    if output == "file" and file_path:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        sys.stdout = open(file_path, "a")
    elif output == "stderr":
        sys.stdout = sys.stderr

    # Create logger with context
    logger = structlog.get_logger(
        "bleu",
        version=os.getenv("BLEU_VERSION", "1.1.3"),
        environment=os.getenv("BLEU_ENV", "development"),
        timestamp=datetime.now(UTC).isoformat(),
    )

    return logger


# Create default logger instance
logger = configure_logger(
    level=os.getenv("BLEU_LOG_LEVEL", "INFO"),
    format=os.getenv("BLEU_LOG_FORMAT", "json"),
    output=os.getenv("BLEU_LOG_OUTPUT", "stdout"),
    file_path=os.getenv("BLEU_LOG_FILE"),
)


def get_logger(name: str, **context: Any) -> structlog.BoundLogger:
    """
    Get a logger instance with additional context.

    Args:
        name: Logger name
        **context: Additional context to bind to logger

    Returns:
        Configured logger instance with context
    """
    return logger.bind(name=name, **context)


def get_timestamp():
    return datetime.now(UTC).isoformat()
