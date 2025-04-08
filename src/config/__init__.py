"""Configuration module."""

from functools import lru_cache
from typing import Optional

_settings = None


@lru_cache()
def get_settings():
    """Get cached settings instance."""
    global _settings
    if _settings is None:
        from src.config.settings import Settings

        _settings = Settings()
    return _settings


__all__ = ["get_settings"]
