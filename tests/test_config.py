"""
Re-export test settings from src so tests and app share one definition.

Use: from tests.test_config import get_test_settings, TestSettings
Canonical source: src.config.test_settings
"""

from src.config.test_settings import TestSettings, get_test_settings

__all__ = ["TestSettings", "get_test_settings"]
