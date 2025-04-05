from datetime import datetime
from typing import Dict, Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel

from ..models.subscription import (
    SubscriptionCreate,
    SubscriptionResponse,
    SubscriptionUpgrade,
    UsageMetrics,
)
from ..services.subscription_service import subscription_service

# Constants
USER_ID_HEADER = "User ID"

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.get("/tiers", response_model=Dict)
async def get_subscription_tiers():
    """Get available subscription tiers."""
    return subscription_service.get_subscription_tiers()


@router.post("/", response_model=SubscriptionResponse)
async def create_subscription(
    subscription: SubscriptionCreate,
    x_user_id: str = Header(..., description=USER_ID_HEADER),
):
    """Create a new subscription."""
    try:
        return subscription_service.create_subscription(
            user_id=x_user_id, tier=subscription.tier
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me", response_model=SubscriptionResponse)
async def get_subscription(x_user_id: str = Header(..., description=USER_ID_HEADER)):
    """Get current subscription details."""
    subscription = subscription_service.get_subscription(x_user_id)
    if not subscription:
        raise HTTPException(status_code=404, detail="No subscription found")
    return subscription


@router.get("/me/usage", response_model=UsageMetrics)
async def get_usage_metrics(x_user_id: str = Header(..., description=USER_ID_HEADER)):
    """Get usage metrics for current subscription."""
    try:
        return subscription_service.get_usage_metrics(x_user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/me/renew", response_model=SubscriptionResponse)
async def renew_subscription(x_user_id: str = Header(..., description=USER_ID_HEADER)):
    """Renew an expired subscription."""
    try:
        return subscription_service.renew_subscription(x_user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/me/upgrade", response_model=SubscriptionResponse)
async def upgrade_subscription(
    upgrade: SubscriptionUpgrade,
    x_user_id: str = Header(..., description=USER_ID_HEADER),
):
    """Upgrade subscription to a higher tier."""
    try:
        return subscription_service.upgrade_subscription(
            user_id=x_user_id, new_tier=upgrade.tier
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


class SubscriptionUpgrade(BaseModel):
    tier: str
    payment_token: str


@router.get("/subscriptions/me")
async def get_subscription(user_id: str = Header(..., alias=USER_ID_HEADER)):
    """Get current subscription details."""
    try:
        # Implementation here
        pass
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/subscriptions/me/usage")
async def get_usage(user_id: str = Header(..., alias=USER_ID_HEADER)):
    """Get current subscription usage."""
    try:
        # Implementation here
        pass
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/subscriptions/me/renew")
async def renew_subscription(user_id: str = Header(..., alias=USER_ID_HEADER)):
    """Renew an expired subscription."""
    try:
        # Implementation here
        pass
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/subscriptions/me/upgrade")
async def upgrade_subscription(
    upgrade: SubscriptionUpgrade, user_id: str = Header(..., alias=USER_ID_HEADER)
):
    """Upgrade subscription to a higher tier."""
    try:
        # Implementation here
        pass
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
