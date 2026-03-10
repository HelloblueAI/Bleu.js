"""
Shared constants for Bleu.js API client.

Single source of truth for base URL, endpoints, default models, and timeouts.
Used by both sync and async clients and by the CLI.
"""

# Base URL and env var (CLI and client read BLEUJS_BASE_URL; default below)
DEFAULT_BASE_URL = "https://bleujs.org"

# API paths (relative to base URL)
ENDPOINT_HEALTH = "/health"
ENDPOINT_CHAT = "/api/v1/chat"
ENDPOINT_GENERATE = "/api/v1/generate"
ENDPOINT_EMBED = "/api/v1/embed"
ENDPOINT_MODELS = "/api/v1/models"

# Default model names (used by client methods and CLI)
DEFAULT_MODEL_CHAT = "bleu-chat-v1"
DEFAULT_MODEL_GENERATE = "bleu-gen-v1"
DEFAULT_MODEL_EMBED = "bleu-embed-v1"

# Request defaults
DEFAULT_TIMEOUT = 60.0
DEFAULT_MAX_RETRIES = 3


def get_headers(api_key: str, version: str) -> dict:
    """Build HTTP headers for API requests (shared by sync and async clients)."""
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": f"bleu-js-python/{version}",
    }
