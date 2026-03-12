"""
Live API smoke tests (bleujs.org).

Run only when BLEUJS_API_KEY is set. Use to verify the live API is up and
that chat/generate/embed respond (or fail with a clear error).

  pytest tests/test_live_api_smoke.py -v
  pytest tests/test_live_api_smoke.py -v -m integration  # same

Excluded from default CI; run locally or in a scheduled job with a test key.
"""

import os

import pytest

pytest.importorskip("httpx")

from bleujs.api_client import BleuAPIClient

# Skip entire module if no live API key (avoid accidental calls)
pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        not os.environ.get("BLEUJS_API_KEY"),
        reason="BLEUJS_API_KEY not set (live smoke tests optional)",
    ),
]


class TestLiveAPISmoke:
    """Smoke tests against the live bleujs.org API."""

    def test_health_returns_ok(self):
        """GET /health returns and indicates API is up."""
        client = BleuAPIClient(timeout=15)
        out = client.health()
        assert isinstance(out, dict)
        assert out.get("status") == "ok" or "status" in out or "version" in out

    def test_list_models_returns_list(self):
        """GET /api/v1/models returns a list of models."""
        client = BleuAPIClient(timeout=15)
        models = client.list_models()
        assert isinstance(models, list)
        if models:
            assert hasattr(models[0], "id")
            assert hasattr(models[0], "object")
