"""
Pytest configuration file.
"""

import asyncio
import os
import sys
from pathlib import Path

import pytest

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def test_config():
    """Provide test configuration."""
    return {
        "environment": "test",
        "debug": True,
        "sentry_dsn": None,
        "max_workers": 2,
        "memory_threshold": 1024,
        "cache_ttl": 1,
        "batch_size": 2,
        "max_concurrent": 2,
    }


@pytest.fixture(scope="session")
def test_data_dir():
    """Provide path to test data directory."""
    return Path(__file__).parent / "data"


@pytest.fixture(autouse=True)
def setup_test_env():
    """Setup test environment variables."""
    os.environ["TESTING"] = "true"
    yield
    os.environ.pop("TESTING", None)
