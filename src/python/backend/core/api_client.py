"""
API client for making requests to the Bleu.js API.
"""

import time
from typing import Any, Dict, Optional

import requests
from requests.exceptions import RequestException

from ..config.api_config import api_config


class APIClient:
    """Client for making requests to the Bleu.js API."""

    def __init__(self):
        """Initialize the API client."""
        self.base_url = api_config.base_url
        self.api_key = api_config.api_key
        self.timeout = api_config.timeout
        self.max_retries = api_config.max_retries
        self.retry_delay = api_config.retry_delay

        # Create session with default headers
        self.session = requests.Session()
        self.session.headers.update(
            {"Content-Type": "application/json", "x-api-key": self.api_key}
        )

    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """Make a request to the API with retries."""
        url = f"{self.base_url}{endpoint}"

        # Update headers if provided
        if headers:
            self.session.headers.update(headers)

        # Make request with retries
        for attempt in range(self.max_retries):
            try:
                response = self.session.request(
                    method=method,
                    url=url,
                    json=data,
                    params=params,
                    timeout=self.timeout,
                )
                response.raise_for_status()
                return response.json()

            except RequestException:
                if attempt == self.max_retries - 1:
                    raise
                time.sleep(self.retry_delay)

    def predict(self, input_text: str) -> Dict[str, Any]:
        """Make a prediction request."""
        return self._make_request(
            method="POST",
            endpoint=api_config.endpoints["predict"],
            data={"input": input_text},
        )

    def get_root(self) -> Dict[str, Any]:
        """Get root endpoint response."""
        return self._make_request(method="GET", endpoint=api_config.endpoints["root"])

    def post_root(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Post to root endpoint."""
        return self._make_request(
            method="POST", endpoint=api_config.endpoints["root"], data=data
        )

    def health_check(self) -> Dict[str, Any]:
        """Check API health."""
        return self._make_request(method="GET", endpoint=api_config.endpoints["health"])


# Create global client instance
api_client = APIClient()
