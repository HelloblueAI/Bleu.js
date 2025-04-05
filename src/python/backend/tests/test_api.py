"""
Tests for the API client.
"""

import pytest

from ..core.api_client import api_client


def test_health_check():
    """Test health check endpoint."""
    response = api_client.health_check()
    assert isinstance(response, dict)
    assert "status" in response


def test_predict():
    """Test prediction endpoint."""
    response = api_client.predict("Test input")
    assert isinstance(response, dict)
    assert "message" in response
    assert "user_input" in response
    assert response["user_input"] == "Test input"


def test_get_root():
    """Test root GET endpoint."""
    response = api_client.get_root()
    assert isinstance(response, dict)


def test_post_root():
    """Test root POST endpoint."""
    data = {"input": "Hello Bleu.js!"}
    response = api_client.post_root(data)
    assert isinstance(response, dict)
