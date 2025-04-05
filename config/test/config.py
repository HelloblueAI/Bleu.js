"""Test configuration module for Bleu.js."""

import os
from typing import Any, Dict

from dotenv import load_dotenv

load_dotenv()

# Test user configuration
TEST_USER_EMAIL = os.getenv("TEST_USER_EMAIL", "test@example.com")
TEST_USER_PASSWORD = os.getenv("TEST_USER_PASSWORD", "dummy_password")  # nosec
TEST_API_KEY = os.getenv("TEST_API_KEY", "dummy_key")  # nosec

# Test database configuration
TEST_DB_HOST = os.getenv("TEST_DB_HOST", "localhost")
TEST_DB_PORT = int(os.getenv("TEST_DB_PORT", "5432"))
TEST_DB_NAME = os.getenv("TEST_DB_NAME", "test_db")
TEST_DB_USER = os.getenv("TEST_DB_USER", "test_user")
TEST_DB_PASSWORD = os.getenv("TEST_DB_PASSWORD", "dummy_db_password")  # nosec

# Test API configuration
TEST_API_HOST = os.getenv("TEST_API_HOST", "localhost")
TEST_API_PORT = int(os.getenv("TEST_API_PORT", "8000"))

# Test rate limiting configuration
TEST_RATE_LIMIT = int(os.getenv("TEST_RATE_LIMIT", "100"))
TEST_RATE_LIMIT_WINDOW = int(
    os.getenv("TEST_RATE_LIMIT_WINDOW", "3600")
)  # 1 hour in seconds

# Database configuration
DATABASE_CONFIG: Dict[str, Any] = {
    "url": "sqlite:///./test.db",
    "echo": False,
    "pool_pre_ping": True,
}

# Rate limiting configuration
RATE_LIMITING_CONFIG: Dict[str, Any] = {
    "window": 3600,  # 1 hour in seconds
    "max_calls": 100,
}

# Security configuration
SECURITY_CONFIG: Dict[str, Any] = {
    "jwt_secret_key": "test_secret_key",
    "jwt_algorithm": "HS256",
    "access_token_expire_minutes": 30,
}

# API configuration
API_CONFIG: Dict[str, Any] = {
    "version": "v1",
    "prefix": "/api",
    "debug": True,
    "testing": True,
}
