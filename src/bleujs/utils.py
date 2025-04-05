"""
Utility functions for Bleu.js
"""

import json
import logging
from datetime import UTC, datetime
from typing import Any, Dict

import structlog


def setup_logging(level: int = logging.INFO) -> None:
    """Setup structured logging for the application."""
    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        logger_factory=structlog.PrintLoggerFactory(),
        wrapper_class=structlog.make_filtering_bound_logger(level),
        cache_logger_on_first_use=True,
    )


def get_metrics() -> Dict[str, Any]:
    """Get current system metrics."""
    return {
        "timestamp": datetime.now(UTC).isoformat(),
        "version": "1.1.3",
        "system": {
            "cpu_percent": 0.0,  # To be implemented
            "memory_percent": 0.0,  # To be implemented
            "gpu_utilization": 0.0,  # To be implemented
        },
    }


def save_to_json(data: Dict[str, Any], filepath: str) -> None:
    """Save data to a JSON file."""
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2)


def get_current_timestamp():
    return datetime.now(UTC)
