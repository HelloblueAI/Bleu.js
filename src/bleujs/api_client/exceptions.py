"""
Exception classes for Bleu.js API Client
"""

from typing import Optional, Dict, Any


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
    pass


class RateLimitError(BleuAPIError):
    """
    Raised when API rate limit is exceeded (429 Too Many Requests)
    
    This typically means:
    - Too many requests in a short time
    - Need to implement backoff/retry logic
    """
    pass


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


def parse_api_error(status_code: int, response_data: Dict[str, Any]) -> BleuAPIError:
    """
    Parse API error response and return appropriate exception
    
    Args:
        status_code: HTTP status code
        response_data: Response body as dictionary
    
    Returns:
        Appropriate BleuAPIError subclass instance
    """
    error_message = response_data.get("error", {}).get("message", "Unknown error")
    
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
    return error_class(
        message=error_message,
        status_code=status_code,
        response=response_data,
    )

