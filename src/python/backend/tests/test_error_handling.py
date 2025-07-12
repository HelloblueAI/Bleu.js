"""
Tests for the error handling system.
"""

import asyncio

import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from ..core.error_handling import (
    AuthenticationError,
    ErrorContext,
    ErrorHandler,
    ValidationError,
)

app = FastAPI()
error_handler = ErrorHandler(
    {
        "sentry_dsn": None,  # Disable Sentry for testing
        "environment": "test",
        "debug": True,
    }
)


@app.get("/test-validation-error")
@error_handler.error_handler(ValidationError)
async def test_validation_error():
    raise ValidationError("Test validation error")


@app.get("/test-auth-error")
@error_handler.error_handler(AuthenticationError)
async def test_auth_error():
    raise AuthenticationError("Test auth error")


@app.get("/test-retry")
@error_handler.retry_on_error(max_retries=3, delay=0.1)
async def test_retry():
    if not hasattr(test_retry, "attempts"):
        test_retry.attempts = 0
    test_retry.attempts += 1
    if test_retry.attempts < 3:
        raise Exception("Test retry error")
    return {"status": "success"}


@app.get("/test-circuit-breaker")
@error_handler.circuit_breaker(failure_threshold=2, reset_timeout=0.1)
async def test_circuit_breaker():
    if not hasattr(test_circuit_breaker, "failures"):
        test_circuit_breaker.failures = 0
    test_circuit_breaker.failures += 1
    if test_circuit_breaker.failures <= 2:
        raise Exception("Test circuit breaker error")
    return {"status": "success"}


client = TestClient(app)


def test_validation_error_handling():
    """Test validation error handling."""
    response = client.get("/test-validation-error")
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
    assert response.json()["error"]["message"] == "Test validation error"


def test_auth_error_handling():
    """Test authentication error handling."""
    response = client.get("/test-auth-error")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTHENTICATION_ERROR"
    assert response.json()["error"]["message"] == "Test auth error"


@pytest.mark.asyncio
async def test_retry_mechanism():
    """Test retry mechanism."""
    response = client.get("/test-retry")
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert test_retry.attempts == 3


@pytest.mark.asyncio
async def test_circuit_breaker_async():
    """Test circuit breaker pattern."""
    # First two requests should fail
    for _ in range(2):
        response = client.get("/test-circuit-breaker")
        assert response.status_code == 500

    # Wait for circuit breaker to reset
    await asyncio.sleep(0.2)

    # Next request should succeed
    response = client.get("/test-circuit-breaker")
    assert response.status_code == 200
    assert response.json()["status"] == "success"


def test_error_context():
    """Test error context creation."""
    request = Request(
        scope={
            "type": "http",
            "method": "GET",
            "path": "/test",
            "query_string": b"param=value",
            "headers": [(b"x-request-id", b"test-id")],
        }
    )

    error = Exception("Test error")
    context = asyncio.run(error_handler._create_error_context(request, error))

    assert isinstance(context, ErrorContext)
    assert context.request_id == "test-id"
    assert context.endpoint == "/test"
    assert context.method == "GET"
    assert context.params == {"param": "value"}
    assert "x-request-id" in context.headers


def test_error_stats():
    """Test error statistics collection."""
    # Generate some errors
    client.get("/test-validation-error")
    client.get("/test-auth-error")

    stats = asyncio.run(error_handler.get_error_stats())

    assert stats["total_errors"] >= 2
    assert "ValidationError" in stats["error_counts"]
    assert "AuthenticationError" in stats["error_counts"]
    assert stats["latest_error"] is not None
