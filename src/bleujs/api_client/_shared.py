"""
Shared request/response handling for Bleu.js API client.

Used by both sync (client.py) and async (async_client.py) to avoid duplication
of response parsing and error mapping.
"""

import json
from typing import Any, Dict

try:
    import httpx
except ImportError:
    httpx = None

from .exceptions import parse_api_error


def handle_response(response: "httpx.Response") -> Dict[str, Any]:
    """
    Parse HTTP response: return JSON body on 200, else raise appropriate BleuAPIError.

    Shared by sync and async _request methods so error handling stays in one place.
    """
    if response.status_code == 200:
        return response.json()
    try:
        error_data = response.json()
    except (json.JSONDecodeError, ValueError):
        error_data = {"error": {"message": response.text or "Unknown error"}}
    raise parse_api_error(response.status_code, error_data)
