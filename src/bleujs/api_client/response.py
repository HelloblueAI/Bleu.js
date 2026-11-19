"""
Response metadata helpers for the Bleu.js API client.

``APIResponse`` wraps a parsed result with full HTTP response headers for
opt-in use via ``client.with_raw_response``. Existing ``client.chat()`` (etc.)
callers keep receiving the parsed model only.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import (
    Any,
    Dict,
    Generic,
    List,
    Mapping,
    Optional,
    TypeVar,
)

T = TypeVar("T")


def normalize_headers(headers: Optional[Any]) -> Dict[str, str]:
    """
    Copy response headers into a plain dict with lowercase keys.

    Works with ``httpx.Headers``, a Mapping, or None. Values are coerced to str.
    Non-iterable header mocks (common in unit tests) yield an empty dict.
    """
    if headers is None:
        return {}
    if isinstance(headers, dict):
        return {
            str(k).lower(): "" if v is None else str(v) for k, v in headers.items()
        }
    items = getattr(headers, "items", None)
    if not callable(items):
        return {}
    try:
        pairs = list(items())
    except TypeError:
        return {}
    out: Dict[str, str] = {}
    for key, value in pairs:
        if key is None:
            continue
        out[str(key).lower()] = "" if value is None else str(value)
    return out


def extract_request_id(
    headers: Optional[Mapping[str, str]] = None,
    body: Optional[Any] = None,
) -> Optional[str]:
    """
    Resolve a request ID: response header preferred, then JSON body.

    Header names checked (case-insensitive via normalized map):
    ``x-request-id``, ``x-request-id`` variants already lowercased.

    Body fallbacks: ``error.request_id``, top-level ``request_id``,
    ``meta.request_id``.
    """
    if headers:
        header_val = headers.get("x-request-id")
        if header_val is None:
            # tolerate unusual casing if caller did not normalize
            for k, v in headers.items():
                if (
                    str(k).lower() == "x-request-id"
                    and v is not None
                    and str(v).strip()
                ):
                    return str(v).strip()
        elif str(header_val).strip():
            return str(header_val).strip()

    if not isinstance(body, dict):
        return None

    err = body.get("error")
    if isinstance(err, dict):
        rid = err.get("request_id")
        if rid is not None and str(rid).strip():
            return str(rid).strip()

    rid = body.get("request_id")
    if rid is not None and str(rid).strip():
        return str(rid).strip()

    meta = body.get("meta")
    if isinstance(meta, dict):
        rid = meta.get("request_id")
        if rid is not None and str(rid).strip():
            return str(rid).strip()

    return None


@dataclass(frozen=True)
class APIResponse(Generic[T]):
    """
    Parsed API payload plus response metadata.

    Returned by ``BleuAPIClient.with_raw_response`` / ``AsyncBleuAPIClient.with_raw_response``
    methods. ``data`` is the same object normal client methods return.
    ``headers`` contains all response headers (lowercase keys).
    """

    data: T
    headers: Mapping[str, str]
    status_code: int
    request_id: Optional[str] = None

    def get_header(self, name: str, default: Optional[str] = None) -> Optional[str]:
        """Case-insensitive header lookup."""
        if name is None:
            return default
        return self.headers.get(str(name).lower(), default)


class BleuAPIClientWithRawResponse:
    """
    Opt-in sync wrapper: same methods as ``BleuAPIClient``, returning ``APIResponse``.

    Does not change retry defaults or request behavior—only the return shape.
    """

    def __init__(self, client: Any) -> None:
        self._client = client

    def chat(self, *args: Any, **kwargs: Any) -> APIResponse[Any]:
        return self._client._chat_api_response(*args, **kwargs)

    def generate(self, *args: Any, **kwargs: Any) -> APIResponse[Any]:
        return self._client._generate_api_response(*args, **kwargs)

    def embed(self, *args: Any, **kwargs: Any) -> APIResponse[Any]:
        return self._client._embed_api_response(*args, **kwargs)

    def health(self, *args: Any, **kwargs: Any) -> APIResponse[Dict[str, Any]]:
        return self._client._health_api_response(*args, **kwargs)

    def list_models(self, *args: Any, **kwargs: Any) -> APIResponse[List[Any]]:
        return self._client._list_models_api_response(*args, **kwargs)


class AsyncBleuAPIClientWithRawResponse:
    """
    Opt-in async wrapper: same methods as ``AsyncBleuAPIClient``, returning ``APIResponse``.
    """

    def __init__(self, client: Any) -> None:
        self._client = client

    async def chat(self, *args: Any, **kwargs: Any) -> APIResponse[Any]:
        return await self._client._chat_api_response(*args, **kwargs)

    async def generate(self, *args: Any, **kwargs: Any) -> APIResponse[Any]:
        return await self._client._generate_api_response(*args, **kwargs)

    async def embed(self, *args: Any, **kwargs: Any) -> APIResponse[Any]:
        return await self._client._embed_api_response(*args, **kwargs)

    async def health(self, *args: Any, **kwargs: Any) -> APIResponse[Dict[str, Any]]:
        return await self._client._health_api_response(*args, **kwargs)

    async def list_models(self, *args: Any, **kwargs: Any) -> APIResponse[List[Any]]:
        return await self._client._list_models_api_response(*args, **kwargs)
