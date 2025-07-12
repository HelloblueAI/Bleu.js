from typing import Dict

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from ..models.subscription import (
    SubscriptionCreate,
    SubscriptionResponse,
    SubscriptionUpgrade,
    UsageMetrics,
)
from ..services.subscription_service import subscription_service
from ..services.user_service import user_service

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
        # Get user from database
        user = user_service.get_user(x_user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return await subscription_service.create_subscription(
            user=user,
            plan_type=subscription.tier,
            payment_method_id=subscription.payment_method_id,
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


# Removed duplicate route definitions to fix F811 redefinition errors
