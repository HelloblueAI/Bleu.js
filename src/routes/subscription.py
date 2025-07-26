"""Subscription routes."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.user import User
from src.services.auth_service import get_current_user_dep
from src.services.subscription_service import SubscriptionService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.get("/plans", response_model=list[dict])
async def get_subscription_plans(
    db: Session = Depends(get_db),
):
    """Get available subscription plans."""
    try:
        subscription_service = SubscriptionService(db)
        return await subscription_service.get_subscription_plans()
    except Exception as e:
        logger.error(f"Error getting subscription plans: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get subscription plans",
        )


@router.get("/current", response_model=dict)
async def get_current_subscription(
    current_user: User = Depends(get_current_user_dep()),
    db: Session = Depends(get_db),
):
    """Get current user's subscription."""
    try:
        subscription_service = SubscriptionService(db)
        subscription = await subscription_service.get_subscription(str(current_user.id))
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active subscription found",
            )
        return subscription
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting current subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get subscription",
        )


@router.get("/usage", response_model=dict)
async def get_subscription_usage(
    current_user: User = Depends(get_current_user_dep()),
    db: Session = Depends(get_db),
):
    """Get current user's subscription usage."""
    try:
        subscription_service = SubscriptionService(db)
        return await subscription_service.get_subscription_usage(str(current_user.id))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting subscription usage: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get subscription usage",
        )


@router.post("/upgrade/{tier}", response_model=dict)
async def upgrade_subscription(
    tier: str,
    current_user: User = Depends(get_current_user_dep()),
    db: Session = Depends(get_db),
):
    """Upgrade user's subscription tier."""
    try:
        subscription_service = SubscriptionService(db)
        return await subscription_service.upgrade_subscription(
            str(current_user.id), tier
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error upgrading subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upgrade subscription",
        )


@router.post("/renew", response_model=dict)
async def renew_subscription(
    current_user: User = Depends(get_current_user_dep()),
    db: Session = Depends(get_db),
):
    """Renew user's subscription."""
    try:
        subscription_service = SubscriptionService(db)
        return await subscription_service.renew_subscription(str(current_user.id))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error renewing subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to renew subscription",
        )


@router.post("/cancel", response_model=dict)
async def cancel_subscription(
    current_user: User = Depends(get_current_user_dep()),
    db: Session = Depends(get_db),
):
    """Cancel user's subscription."""
    try:
        subscription_service = SubscriptionService(db)
        subscription = await subscription_service.cancel_subscription(current_user)
        return {
            "message": "Subscription cancelled successfully",
            "subscription_id": str(subscription.id),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel subscription",
        )


@router.get("/analytics", response_model=dict)
async def get_subscription_analytics(
    current_user: User = Depends(get_current_user_dep()),
    db: Session = Depends(get_db),
):
    """Get subscription analytics (admin only)."""
    try:
        # Check if user is admin (you may need to implement this check)
        if not current_user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required",
            )

        subscription_service = SubscriptionService(db)
        return await subscription_service.get_subscription_analytics()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting subscription analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get subscription analytics",
        )


@router.get("/user-data", response_model=dict)
async def get_user_subscription_data(
    current_user: User = Depends(get_current_user_dep()),
    db: Session = Depends(get_db),
):
    """Get comprehensive subscription data for current user."""
    try:
        subscription_service = SubscriptionService(db)
        return await subscription_service.get_user_subscription_data(current_user)
    except Exception as e:
        logger.error(f"Error getting user subscription data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user subscription data",
        )
