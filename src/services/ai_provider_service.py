"""
AI provider service with failover: BleuJS → OpenAI → Anthropic → in-process.

When a provider fails (5xx, timeout, exception), the next real provider is tried
before falling back to in-process. This keeps real AI usage high and error rate low.
"""

import logging
from typing import Any, Dict, List, Optional

import aiohttp

from src.config import get_settings

logger = logging.getLogger(__name__)

# Provider order for failover
PROVIDER_ORDER = ("bleujs", "openai", "anthropic", "in_process")


async def _try_bleujs_backend(
    messages: List[Dict[str, str]],
    model: str,
    temperature: float,
    max_tokens: int,
) -> Optional[str]:
    """Try BleuJS backend (e.g. Railway predict API or product /api/v1/chat). Returns content or None."""
    settings = get_settings()
    url = (getattr(settings, "BLEUJS_BACKEND_URL", None) or "").strip()
    if not url:
        return None
    url = url.rstrip("/")
    if not url.startswith("http"):
        url = f"https://{url}"
    chat_url = (
        f"{url}/chat" if url.rstrip("/").endswith("api/v1") else f"{url}/api/v1/chat"
    )
    payload = {
        "messages": messages,
        "model": model,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                chat_url,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=60),
                headers={"Content-Type": "application/json"},
            ) as resp:
                if resp.status != 200:
                    logger.warning(
                        "BleuJS backend returned %s for %s", resp.status, chat_url
                    )
                    return None
                data = await resp.json()
                # OpenAI-style or flat content
                if isinstance(data.get("content"), str):
                    return data["content"]
                choices = data.get("choices") or []
                if choices and isinstance(choices[0], dict):
                    msg = choices[0].get("message") or choices[0]
                    if isinstance(msg.get("content"), str):
                        return msg["content"]
                return None
    except Exception as e:
        logger.warning("BleuJS backend request failed: %s", e)
        return None


async def _try_openai(
    messages: List[Dict[str, str]],
    model: str,
    temperature: float,
    max_tokens: int,
) -> Optional[str]:
    """Try OpenAI API. Returns content or None."""
    settings = get_settings()
    key = getattr(settings, "OPENAI_API_KEY", None)
    if not key:
        return None
    try:
        api_key = key.get_secret_value() if hasattr(key, "get_secret_value") else key
    except Exception:
        return None
    if not api_key or api_key.startswith("your_"):
        return None
    # Map our model name to OpenAI if needed
    openai_model = (
        "gpt-4o-mini" if "bleu" in (model or "").lower() else (model or "gpt-4o-mini")
    )
    payload = {
        "model": openai_model,
        "messages": [
            {"role": m.get("role", "user"), "content": m.get("content", "")}
            for m in messages
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.openai.com/v1/chat/completions",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=60),
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            ) as resp:
                if resp.status != 200:
                    logger.warning("OpenAI returned %s", resp.status)
                    return None
                data = await resp.json()
                choices = data.get("choices") or []
                if choices and isinstance(choices[0], dict):
                    msg = choices[0].get("message") or {}
                    if isinstance(msg.get("content"), str):
                        return msg["content"]
                return None
    except Exception as e:
        logger.warning("OpenAI request failed: %s", e)
        return None


async def _try_anthropic(
    messages: List[Dict[str, str]],
    model: str,
    temperature: float,
    max_tokens: int,
) -> Optional[str]:
    """Try Anthropic API. Returns content or None."""
    settings = get_settings()
    key = getattr(settings, "ANTHROPIC_API_KEY", None)
    if not key:
        return None
    try:
        api_key = key.get_secret_value() if hasattr(key, "get_secret_value") else key
    except Exception:
        return None
    if not api_key or api_key.startswith("your_"):
        return None
    # Build prompt from messages (Anthropic uses user-assistant turn format)
    last_user = next(
        (m["content"] for m in reversed(messages) if m.get("role") == "user"), ""
    )
    if not last_user and messages:
        last_user = messages[-1].get("content", "")
    payload = {
        "model": "claude-3-5-haiku-20241022",
        "max_tokens": max_tokens,
        "messages": [{"role": "user", "content": last_user}],
    }
    if temperature is not None:
        payload["temperature"] = temperature
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.anthropic.com/v1/messages",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=60),
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json",
                },
            ) as resp:
                if resp.status != 200:
                    logger.warning("Anthropic returned %s", resp.status)
                    return None
                data = await resp.json()
                content = data.get("content") or []
                for block in content:
                    if block.get("type") == "text" and isinstance(
                        block.get("text"), str
                    ):
                        return block["text"]
                return None
    except Exception as e:
        logger.warning("Anthropic request failed: %s", e)
        return None


def _in_process_fallback(prompt: str, model: str) -> str:
    """In-process fallback when all real providers fail."""
    return (
        f"Response to: {prompt} "
        "(Note: External AI temporarily unavailable; using in-process fallback)"
    )


async def get_chat_completion(
    messages: List[Dict[str, str]],
    model: str = "bleu-quantum-1",
    temperature: float = 0.7,
    max_tokens: int = 1000,
) -> tuple[str, str]:
    """
    Get chat completion with provider failover.

    Tries in order: BleuJS backend → OpenAI → Anthropic → in-process fallback.

    Returns:
        (content, provider_used) where provider_used is one of
        "bleujs", "openai", "anthropic", "in_process".
    """
    last_user = ""
    for m in reversed(messages or []):
        if m.get("role") == "user":
            last_user = m.get("content") or ""
            break
    if not last_user and messages:
        last_user = messages[-1].get("content") or ""

    # 1. Try BleuJS backend
    content = await _try_bleujs_backend(messages, model, temperature, max_tokens)
    if content is not None:
        logger.info("AI response from provider: bleujs")
        return (content, "bleujs")

    # 2. Try OpenAI
    content = await _try_openai(messages, model, temperature, max_tokens)
    if content is not None:
        logger.info("AI response from provider: openai")
        return (content, "openai")

    # 3. Try Anthropic
    content = await _try_anthropic(messages, model, temperature, max_tokens)
    if content is not None:
        logger.info("AI response from provider: anthropic")
        return (content, "anthropic")

    # 4. In-process fallback
    logger.info("AI response from provider: in_process (fallback)")
    return (_in_process_fallback(last_user, model), "in_process")


async def get_generation_completion(
    prompt: str,
    model: str = "bleu-quantum-1",
    temperature: float = 0.7,
    max_tokens: int = 1000,
) -> tuple[str, str]:
    """Get text generation with same provider failover. Returns (text, provider_used)."""
    messages = [{"role": "user", "content": prompt}]
    return await get_chat_completion(
        messages, model=model, temperature=temperature, max_tokens=max_tokens
    )
