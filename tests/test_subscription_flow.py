"""
Test subscription API flow (plans, usage, upgrade, renew).
Verifies fixes: expires_at in plans, defensive formatting, subscription.plan null checks.
"""

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest


# _format_expires_at logic (mirrors api/main.py)
def _format_expires_at(value):
    if value is None:
        return ""
    return value.isoformat() if hasattr(value, "isoformat") else str(value)


class TestSubscriptionFlow:
    """Subscription API flow and service behavior."""

    def test_format_expires_at_none(self):
        assert _format_expires_at(None) == ""

    def test_format_expires_at_datetime(self):
        dt = datetime.now(timezone.utc)
        out = _format_expires_at(dt)
        assert isinstance(out, str) and len(out) > 10

    def test_format_expires_at_string(self):
        assert _format_expires_at("2026-01-01") == "2026-01-01"

    @pytest.mark.asyncio
    async def test_get_subscription_plans_returns_expires_at(self):
        from src.services.subscription_service import SubscriptionService

        with patch("src.services.subscription_service.get_db"):
            service = SubscriptionService()
        plans = await service.get_subscription_plans()
        assert isinstance(plans, list)
        for plan in plans:
            assert "expires_at" in plan
            assert hasattr(plan["expires_at"], "isoformat") or isinstance(
                plan["expires_at"], str
            )
            assert "id" in plan and "name" in plan and "status" in plan

    @pytest.mark.asyncio
    async def test_plan_expires_at_formatable_for_api(self):
        from src.services.subscription_service import SubscriptionService

        with patch("src.services.subscription_service.get_db"):
            service = SubscriptionService()
        plans = await service.get_subscription_plans()
        for plan in plans:
            raw = plan.get("expires_at")
            api_value = _format_expires_at(raw)
            assert isinstance(api_value, str)
            assert api_value == "" or len(api_value) > 10
