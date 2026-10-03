"""Unit tests for BleuAPIClient timeout handling."""

import httpx
import pytest

from bleujs.api_client import BleuAPIClient
from bleujs.api_client.exceptions import NetworkError


def test_read_timeout_raises_network_error_without_retry_sleep(monkeypatch):
    client = BleuAPIClient(api_key="test-key", timeout=0.01, max_retries=1)
    monkeypatch.setattr(client._client, "request", _raise_timeout)
    monkeypatch.setattr("bleujs.api_client.client.time.sleep", lambda _seconds: None)

    with pytest.raises(NetworkError, match="Request timeout"):
        client.health()


def test_connect_and_read_timeout_tuple_is_accepted():
    client = BleuAPIClient(api_key="test-key", timeout=(0.2, 0.4), max_retries=1)
    assert client.timeout == (0.2, 0.4)


def test_timeout_retries_then_raises(monkeypatch):
    client = BleuAPIClient(api_key="test-key", timeout=1, max_retries=2)
    calls = {"n": 0}

    def request(*_args, **_kwargs):
        calls["n"] += 1
        raise httpx.ReadTimeout("read timed out")

    monkeypatch.setattr(client._client, "request", request)
    monkeypatch.setattr("bleujs.api_client.client.time.sleep", lambda _seconds: None)

    with pytest.raises(NetworkError, match="Request timeout"):
        client.health()
    assert calls["n"] == 2


def _raise_timeout(*_args, **_kwargs):
    raise httpx.TimeoutException("timed out")
