"""
Tests for request_id on errors and with_raw_response header access.
"""

from unittest.mock import Mock, patch

import pytest

try:
    import httpx

    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False

from bleujs.api_client import (
    APIResponse,
    AuthenticationError,
    BleuAPIClient,
    InvalidRequestError,
    RateLimitError,
)
from bleujs.api_client.exceptions import parse_api_error
from bleujs.api_client.response import extract_request_id, normalize_headers

try:
    from bleujs.api_client import AsyncBleuAPIClient

    ASYNC_AVAILABLE = True
except ImportError:
    ASYNC_AVAILABLE = False


CHAT_OK = {
    "id": "chat-1",
    "object": "chat.completion",
    "created": 1,
    "model": "bleu-chat-v1",
    "choices": [{"message": {"role": "assistant", "content": "Hi"}}],
    "usage": {"prompt_tokens": 1, "completion_tokens": 1, "total_tokens": 2},
}


def _resp(status, json_body, headers=None):
    r = Mock()
    r.status_code = status
    r.json = Mock(return_value=json_body)
    r.text = str(json_body)
    r.headers = headers or {}
    return r


@pytest.fixture
def client():
    if not HTTPX_AVAILABLE:
        pytest.skip("httpx not installed")
    return BleuAPIClient(api_key="bleujs_sk_test_12345", max_retries=1)


class TestExtractRequestId:
    def test_header_preferred_over_body(self):
        headers = normalize_headers({"X-Request-Id": "hdr_abc"})
        body = {"error": {"message": "x", "request_id": "body_xyz"}}
        assert extract_request_id(headers=headers, body=body) == "hdr_abc"

    def test_body_error_fallback(self):
        assert (
            extract_request_id(
                headers={},
                body={"error": {"message": "x", "request_id": "req_from_error"}},
            )
            == "req_from_error"
        )

    def test_body_top_level_and_meta_fallback(self):
        assert extract_request_id(body={"request_id": "top_id"}) == "top_id"
        assert extract_request_id(body={"meta": {"request_id": "meta_id"}}) == "meta_id"

    def test_missing_ids_returns_none(self):
        assert (
            extract_request_id(headers={}, body={"error": {"message": "no id"}}) is None
        )
        assert extract_request_id(headers=None, body=None) is None


class TestParseApiErrorRequestId:
    def test_header_wins(self):
        err = parse_api_error(
            401,
            {"error": {"message": "bad", "request_id": "body_id"}},
            headers={"x-request-id": "header_id"},
        )
        assert isinstance(err, AuthenticationError)
        assert err.request_id == "header_id"

    def test_body_fallback(self):
        err = parse_api_error(
            400,
            {
                "error": {
                    "message": "bad",
                    "code": "validation_error",
                    "request_id": "b1",
                }
            },
            headers={},
        )
        assert isinstance(err, InvalidRequestError)
        assert err.request_id == "b1"

    def test_missing_request_id(self):
        err = parse_api_error(500, {"error": {"message": "oops"}}, headers=None)
        assert err.request_id is None

    def test_rate_limit_includes_request_id(self):
        err = parse_api_error(
            429,
            {"error": {"message": "slow down", "request_id": "rl_1"}},
            headers={"retry-after": "5", "x-request-id": "rl_hdr"},
        )
        assert isinstance(err, RateLimitError)
        assert err.request_id == "rl_hdr"
        assert err.retry_after == 5.0


class TestSyncClientRequestIdAndRaw:
    @patch("httpx.Client.request")
    def test_error_exposes_request_id_from_header(self, mock_request, client):
        mock_request.return_value = _resp(
            401,
            {"error": {"message": "Invalid API key", "request_id": "body_only"}},
            headers={"x-request-id": "edge-uuid-1"},
        )
        with pytest.raises(AuthenticationError) as exc:
            client.chat([{"role": "user", "content": "Hi"}])
        assert exc.value.request_id == "edge-uuid-1"

    @patch("httpx.Client.request")
    def test_error_falls_back_to_body_request_id(self, mock_request, client):
        mock_request.return_value = _resp(
            400,
            {"error": {"message": "bad", "request_id": "req_body_only"}},
            headers={},
        )
        with pytest.raises(InvalidRequestError) as exc:
            client.chat([{"role": "user", "content": "Hi"}])
        assert exc.value.request_id == "req_body_only"

    @patch("httpx.Client.request")
    def test_error_missing_request_id(self, mock_request, client):
        mock_request.return_value = _resp(
            401, {"error": {"message": "Invalid API key"}}, headers={}
        )
        with pytest.raises(AuthenticationError) as exc:
            client.chat([{"role": "user", "content": "Hi"}])
        assert exc.value.request_id is None

    @patch("httpx.Client.request")
    def test_chat_unchanged_return_type(self, mock_request, client):
        mock_request.return_value = _resp(
            200,
            CHAT_OK,
            headers={"x-request-id": "ok-1", "x-api-usage": "1/500"},
        )
        response = client.chat([{"role": "user", "content": "Hi"}])
        assert response.content == "Hi"
        assert not isinstance(response, APIResponse)

    @patch("httpx.Client.request")
    def test_with_raw_response_retains_all_headers(self, mock_request, client):
        headers = {
            "x-request-id": "req_success",
            "x-api-usage": "12/500",
            "x-ratelimit-limit": "60",
            "x-ratelimit-remaining": "59",
            "x-tokens-total": "42",
            "x-tokens-prompt": "10",
            "x-tokens-completion": "32",
            "x-custom-debug": "keep-me",
        }
        mock_request.return_value = _resp(200, CHAT_OK, headers=headers)
        raw = client.with_raw_response.chat([{"role": "user", "content": "Hi"}])
        assert isinstance(raw, APIResponse)
        assert raw.data.content == "Hi"
        assert raw.status_code == 200
        assert raw.request_id == "req_success"
        assert raw.headers.get("x-api-usage") == "12/500"
        assert raw.headers.get("x-ratelimit-remaining") == "59"
        assert raw.headers.get("x-tokens-total") == "42"
        assert raw.headers.get("x-custom-debug") == "keep-me"
        assert raw.get_header("X-Tokens-Total") == "42"

    @patch("httpx.Client.request")
    def test_with_raw_response_success_body_request_id_fallback(
        self, mock_request, client
    ):
        body = dict(CHAT_OK)
        body["request_id"] = "from_body"
        mock_request.return_value = _resp(200, body, headers={})
        raw = client.with_raw_response.chat([{"role": "user", "content": "Hi"}])
        assert raw.request_id == "from_body"


@pytest.mark.asyncio
class TestAsyncParity:
    @pytest.fixture
    def async_client(self):
        if not HTTPX_AVAILABLE or not ASYNC_AVAILABLE:
            pytest.skip("async client unavailable")
        return AsyncBleuAPIClient(api_key="bleujs_sk_test_12345", max_retries=1)

    @patch("httpx.AsyncClient.request")
    async def test_async_error_request_id_header(self, mock_request, async_client):
        mock_request.return_value = _resp(
            401,
            {"error": {"message": "Invalid", "request_id": "b"}},
            headers={"x-request-id": "async-hdr"},
        )
        with pytest.raises(AuthenticationError) as exc:
            await async_client.chat([{"role": "user", "content": "Hi"}])
        assert exc.value.request_id == "async-hdr"

    @patch("httpx.AsyncClient.request")
    async def test_async_with_raw_response_headers(self, mock_request, async_client):
        mock_request.return_value = _resp(
            200,
            CHAT_OK,
            headers={
                "x-request-id": "async-ok",
                "x-api-usage": "3/500",
                "x-tokens-total": "9",
            },
        )
        raw = await async_client.with_raw_response.chat(
            [{"role": "user", "content": "Hi"}]
        )
        assert isinstance(raw, APIResponse)
        assert raw.data.content == "Hi"
        assert raw.request_id == "async-ok"
        assert raw.headers["x-api-usage"] == "3/500"
        assert raw.headers["x-tokens-total"] == "9"

    @patch("httpx.AsyncClient.request")
    async def test_async_chat_still_returns_model(self, mock_request, async_client):
        mock_request.return_value = _resp(200, CHAT_OK, headers={"x-request-id": "a"})
        response = await async_client.chat([{"role": "user", "content": "Hi"}])
        assert response.content == "Hi"
        assert not isinstance(response, APIResponse)
