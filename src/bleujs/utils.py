"""
Utility functions for Bleu.js
"""

import json
import logging
from datetime import datetime, timezone
from typing import Any


def setup_logging(level: int = logging.INFO) -> None:
    """Setup logging for the application."""
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def get_metrics() -> dict[str, Any]:
    """Get current system metrics."""
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.2.0",
        "system": {
            "cpu_percent": 0.0,  # To be implemented
            "memory_percent": 0.0,  # To be implemented
            "gpu_utilization": 0.0,  # To be implemented
        },
    }


def save_to_json(data: dict[str, Any], filepath: str) -> None:
    """Save data to a JSON file."""
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2)


def get_current_timestamp():
    return datetime.now(timezone.utc)
