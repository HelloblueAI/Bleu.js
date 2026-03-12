"""
Exception classes for Bleu.js API Client
"""

from typing import Any, Dict, Optional

from .constants import DEFAULT_BASE_URL


class BleuAPIError(Exception):
    """Base exception class for all Bleu.js API errors"""

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        response: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.response = response
        super().__init__(self.message)

    def __str__(self) -> str:
        if self.status_code:
            return f"[{self.status_code}] {self.message}"
        return self.message


class AuthenticationError(BleuAPIError):
    """
    Raised when API authentication fails (401 Unauthorized)

    This typically means:
    - Invalid API key
    - Expired API key
    - Missing API key
    """

    USER_HINT = (
        f"Get an API key at {DEFAULT_BASE_URL} or set BLEUJS_API_KEY / "
        "bleu config set api-key <key>"
    )

    @property
    def user_hint(self) -> str:
        """Suggested action for the user (e.g. for CLI display)."""
        return self.USER_HINT


class RateLimitError(BleuAPIError):
    """
    Raised when API rate limit is exceeded (429 Too Many Requests).

    The client can retry 429 automatically when ``retry_on_rate_limit=True``
    (default), using the optional Retry-After header or exponential backoff.
    If you handle this exception yourself, use ``retry_after`` to wait before
    retrying.

    Attributes:
        retry_after: Suggested seconds to wait before retry (from Retry-After
            header, if present). None if not provided by the API.
    """

    USER_HINT = "Wait a moment and retry; use exponential backoff in scripts."

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        response: Optional[Dict[str, Any]] = None,
        retry_after: Optional[float] = None,
    ):
        super().__init__(message=message, status_code=status_code, response=response)
        self.retry_after = retry_after

    @property
    def user_hint(self) -> str:
        return self.USER_HINT


class InvalidRequestError(BleuAPIError):
    """
    Raised when the request is invalid (400 Bad Request)

    This typically means:
    - Invalid parameters
    - Missing required fields
    - Malformed request body
    """

    pass


class APIError(BleuAPIError):
    """
    Raised when the API returns a server error (500+)

    This typically means:
    - Internal server error
    - Service temporarily unavailable
    - Should retry with backoff
    """

    pass


class NetworkError(BleuAPIError):
    """
    Raised when network-related errors occur

    This typically means:
    - Connection timeout
    - DNS resolution failure
    - Network unreachable
    """

    pass


class ValidationError(BleuAPIError):
    """
    Raised when request validation fails before sending

    This typically means:
    - Invalid data types
    - Missing required fields
    - Constraint violations
    """

    pass


def _parse_retry_after(headers: Optional[Any]) -> Optional[float]:
    """Parse Retry-After header (seconds). httpx uses lowercase header names."""
    if headers is None:
        return None
    get = getattr(headers, "get", None)
    if get is None:
        return None
    value = get("retry-after")
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def parse_api_error(
    status_code: int,
    response_data: Any,
    headers: Optional[Any] = None,
) -> BleuAPIError:
    """
    Parse API error response and return appropriate exception.

    Args:
        status_code: HTTP status code
        response_data: Response body (dict preferred; str/list tolerated)
        headers: Optional response headers (e.g. for Retry-After on 429)

    Returns:
        Appropriate BleuAPIError subclass instance (RateLimitError may have
        retry_after set from headers).
    """
    if not isinstance(response_data, dict):
        error_message = str(response_data).strip() if response_data else "Unknown error"
        response_data = {"error": {"message": error_message}}
    else:
        err = response_data.get("error")
        inner = err if isinstance(err, dict) else {}
        error_message = inner.get("message")
        if not error_message:
            detail = response_data.get("detail")
            if isinstance(detail, str):
                error_message = detail
            elif isinstance(detail, list):
                # FastAPI validation errors: list of { "msg": "..." }
                parts = []
                for d in detail[:3]:
                    if isinstance(d, dict) and d.get("msg"):
                        parts.append(d["msg"])
                    elif isinstance(d, str):
                        parts.append(d)
                if parts:
                    error_message = "; ".join(parts)
            if not error_message:
                error_message = response_data.get("message")
            if not error_message:
                error_message = (
                    str(response_data)[:500] if response_data else "Unknown error"
                )

    error_map = {
        400: InvalidRequestError,
        401: AuthenticationError,
        403: AuthenticationError,
        429: RateLimitError,
        500: APIError,
        502: APIError,
        503: APIError,
        504: APIError,
    }

    error_class = error_map.get(status_code, BleuAPIError)
    if error_class is RateLimitError:
        return RateLimitError(
            message=error_message,
            status_code=status_code,
            response=response_data,
            retry_after=_parse_retry_after(headers),
        )
    return error_class(
        message=error_message,
        status_code=status_code,
        response=response_data,
    )
