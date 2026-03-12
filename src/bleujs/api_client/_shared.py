"""
Shared request/response handling for Bleu.js API client.

Used by both sync (client.py) and async (async_client.py) to avoid duplication
of response parsing and error mapping.
"""

import json
import logging
import random
from typing import Any, Dict, List, Optional

try:
    import httpx
except ImportError:
    httpx = None

from .constants import DEFAULT_MAX_RETRY_DELAY
from .exceptions import _parse_retry_after, parse_api_error
from .models import ChatCompletionResponse, EmbeddingResponse, GenerationResponse

logger = logging.getLogger(__name__)


def compute_retry_delay(
    response: "httpx.Response",
    attempt: int,
    max_delay: float = DEFAULT_MAX_RETRY_DELAY,
) -> float:
    """
    Compute delay in seconds before retry (industry-standard: Retry-After or backoff + jitter).

    Uses Retry-After header if present and valid; otherwise exponential backoff
    with jitter to avoid thundering herd. Capped at max_delay.
    """
    header_delay = _parse_retry_after(getattr(response, "headers", None))
    if header_delay is not None and header_delay >= 0:
        base = min(header_delay, max_delay)
    else:
        base = min(2**attempt, max_delay)
    jitter = random.uniform(0, min(1.0, base * 0.1))
    return base + jitter


def handle_response(response: "httpx.Response") -> Any:
    """
    Parse HTTP response: return JSON body on 200, else raise appropriate BleuAPIError.

    Shared by sync and async _request methods. On error, passes response headers
    so RateLimitError can include retry_after from Retry-After header.
    """
    if response.status_code == 200:
        return response.json()
    try:
        error_data = response.json()
    except (json.JSONDecodeError, ValueError):
        error_data = {"error": {"message": response.text or "Unknown error"}}
    raise parse_api_error(
        response.status_code, error_data, headers=getattr(response, "headers", None)
    )


def _safe_str(v: Any, default: str = "") -> str:
    """Coerce value to str; None or missing becomes default."""
    if v is None:
        return default
    return str(v) if v != "" else default or ""


def normalize_chat_response(raw: Any) -> Dict[str, Any]:
    """
    Normalize chat API response to the shape expected by ChatCompletionResponse.

    Handles: OpenAI-style (choices[].message.content), flat (content),
    choices as list of strings, or bare string/list. Always returns a dict
    with id, created, model, choices.
    """
    if raw is None:
        logger.debug("Chat response was None; normalizing to empty choices.")
        return {
            "id": "",
            "object": "chat.completion",
            "created": 0,
            "model": "",
            "choices": [],
            "usage": None,
        }
    if isinstance(raw, str):
        logger.debug("Chat response was plain string; normalizing to single choice.")
        return {
            "id": "",
            "object": "chat.completion",
            "created": 0,
            "model": "",
            "choices": [{"message": {"role": "assistant", "content": raw}}],
            "usage": None,
        }
    if isinstance(raw, list):
        # Some APIs return a single-element list with the reply string
        if len(raw) == 1 and isinstance(raw[0], str):
            logger.debug("Chat response was single-string list; normalizing.")
            return {
                "id": "",
                "object": "chat.completion",
                "created": 0,
                "model": "",
                "choices": [{"message": {"role": "assistant", "content": raw[0]}}],
                "usage": None,
            }
        logger.debug(
            "Chat response was list (len=%s); normalizing to empty choices.", len(raw)
        )
        return {
            "id": "",
            "object": "chat.completion",
            "created": 0,
            "model": "",
            "choices": [],
            "usage": None,
        }
    if not isinstance(raw, dict):
        text = _safe_str(raw)
        logger.debug("Chat response was %s; treating as content.", type(raw).__name__)
        return {
            "id": "",
            "object": "chat.completion",
            "created": 0,
            "model": "",
            "choices": [{"message": {"role": "assistant", "content": text}}],
            "usage": None,
        }
    # Flat shape: { "content": "..." }
    if "content" in raw and "choices" not in raw:
        logger.debug("Chat response was flat (content only); normalizing to choices.")
        return {
            "id": raw.get("id", ""),
            "object": raw.get("object", "chat.completion"),
            "created": raw.get("created", 0),
            "model": raw.get("model", ""),
            "choices": [{"message": {"role": "assistant", "content": raw["content"]}}],
            "usage": raw.get("usage"),
        }
    choices = raw.get("choices", [])
    if not choices:
        return {
            "id": raw.get("id", ""),
            "object": raw.get("object", "chat.completion"),
            "created": raw.get("created", 0),
            "model": raw.get("model", ""),
            "choices": [],
            "usage": raw.get("usage"),
        }
    # Normalize each choice: may be string or dict with message/content
    normalized_choices: List[Dict[str, Any]] = []
    for c in choices:
        if isinstance(c, str):
            normalized_choices.append({"message": {"role": "assistant", "content": c}})
        elif isinstance(c, dict):
            msg = c.get("message")
            content = c.get("content")
            if isinstance(msg, dict):
                normalized_choices.append(c)
            elif isinstance(msg, str):
                normalized_choices.append(
                    {"message": {"role": "assistant", "content": msg}}
                )
            elif content is not None:
                normalized_choices.append(
                    {"message": {"role": "assistant", "content": str(content)}}
                )
            else:
                normalized_choices.append(
                    {"message": {"role": "assistant", "content": ""}}
                )
        else:
            normalized_choices.append({"message": {"role": "assistant", "content": ""}})
    return {
        "id": raw.get("id", ""),
        "object": raw.get("object", "chat.completion"),
        "created": raw.get("created", 0),
        "model": raw.get("model", ""),
        "choices": normalized_choices,
        "usage": raw.get("usage"),
    }


def normalize_generate_response(raw: Any) -> Dict[str, Any]:
    """
    Normalize generate API response to the shape expected by GenerationResponse.

    Handles: dict with "text", bare string, list (first element), or None.
    """
    if raw is None:
        logger.debug("Generate response was None; normalizing to empty text.")
        return {
            "id": "",
            "object": "text.completion",
            "created": 0,
            "model": "",
            "text": "",
            "usage": None,
            "finish_reason": None,
        }
    if isinstance(raw, str):
        logger.debug("Generate response was plain string; normalizing.")
        return {
            "id": "",
            "object": "text.completion",
            "created": 0,
            "model": "",
            "text": raw,
            "usage": None,
            "finish_reason": None,
        }
    if isinstance(raw, list):
        first = raw[0] if raw and isinstance(raw[0], str) else ""
        logger.debug("Generate response was list; using first string element.")
        return {
            "id": "",
            "object": "text.completion",
            "created": 0,
            "model": "",
            "text": first,
            "usage": None,
            "finish_reason": None,
        }
    if not isinstance(raw, dict):
        logger.debug("Generate response was %s; coercing to text.", type(raw).__name__)
        return {
            "id": "",
            "object": "text.completion",
            "created": 0,
            "model": "",
            "text": _safe_str(raw),
            "usage": None,
            "finish_reason": None,
        }
    return {
        "id": raw.get("id", ""),
        "object": raw.get("object", "text.completion"),
        "created": raw.get("created", 0),
        "model": raw.get("model", ""),
        "text": raw.get("text", ""),
        "usage": raw.get("usage"),
        "finish_reason": raw.get("finish_reason"),
    }


def normalize_embed_response(raw: Any) -> Dict[str, Any]:
    """
    Normalize embed API response to the shape expected by EmbeddingResponse.

    Handles: data as list of { embedding: number[] }, list of raw vectors,
    null/absent data, or non-dict response.
    """
    if raw is None or not isinstance(raw, dict):
        if raw is not None and not isinstance(raw, dict):
            logger.debug(
                "Embed response was %s; normalizing to empty data.", type(raw).__name__
            )
        return {
            "object": "list",
            "data": [],
            "model": "",
            "usage": None,
        }
    data = raw.get("data")
    if data is None or not isinstance(data, list):
        return {
            "object": raw.get("object", "list"),
            "data": [],
            "model": raw.get("model", ""),
            "usage": raw.get("usage"),
        }
    normalized_data: List[Dict[str, Any]] = []
    for i, item in enumerate(data):
        if isinstance(item, dict):
            emb = item.get("embedding", [])
            normalized_data.append(
                {
                    "embedding": emb if isinstance(emb, list) else [],
                    "index": item.get("index", i),
                }
            )
        elif isinstance(item, list):
            normalized_data.append({"embedding": item, "index": i})
        else:
            normalized_data.append({"embedding": [], "index": i})
    return {
        "object": raw.get("object", "list"),
        "data": normalized_data,
        "model": raw.get("model", ""),
        "usage": raw.get("usage"),
    }


def _log_parse_failure(raw: Any, label: str) -> None:
    """Log raw response when building a response model fails (for debugging)."""
    try:
        typ = type(raw).__name__
        preview = repr(raw)[:200]
        logger.debug(
            "%s response parse failed. type=%s preview=%s",
            label,
            typ,
            preview,
        )
    except Exception:  # pragma: no cover
        pass


def build_chat_response(raw: Any) -> ChatCompletionResponse:
    """Normalize and build ChatCompletionResponse; log on validation failure."""
    try:
        normalized = normalize_chat_response(raw)
        return ChatCompletionResponse(**normalized)
    except Exception:
        _log_parse_failure(raw, "Chat")
        raise


def build_generate_response(raw: Any) -> GenerationResponse:
    """Normalize and build GenerationResponse; log on validation failure."""
    try:
        normalized = normalize_generate_response(raw)
        return GenerationResponse(**normalized)
    except Exception:
        _log_parse_failure(raw, "Generate")
        raise


def build_embed_response(raw: Any) -> EmbeddingResponse:
    """Normalize and build EmbeddingResponse; log on validation failure."""
    try:
        normalized = normalize_embed_response(raw)
        return EmbeddingResponse(**normalized)
    except Exception:
        _log_parse_failure(raw, "Embed")
        raise
