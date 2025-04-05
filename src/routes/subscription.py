from datetime import datetime, timezone
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.subscription import (
    PlanType,
    Subscription,
    SubscriptionCreate,
    SubscriptionPlan,
    SubscriptionPlanCreate,
    SubscriptionPlanResponse,
    SubscriptionResponse,
)
from src.models.user import User, UserResponse
from src.services import init_services
from src.services.auth_service import auth_service
from src.services.subscription_service import SubscriptionService

# Error messages
PLAN_NOT_FOUND = "Plan not found"
NO_ACTIVE_SUBSCRIPTION = "No active subscription found"

router = APIRouter()


@router.get("/plans", response_model=List[Dict])
async def get_subscription_plans(db: Session = Depends(get_db)):
    """Get available subscription plans."""
    services = init_services(db)
    return await services["subscription_service"].get_subscription_plans()


@router.post("/plans", response_model=SubscriptionPlanResponse)
async def create_plan(
    plan: SubscriptionPlanCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(auth_service.get_current_user),
):
    """Create a new subscription plan."""
    services = init_services(db)
    return await services["subscription_service"].create_plan(plan, db)


@router.post("/subscribe", response_model=SubscriptionResponse)
async def create_subscription(
    subscription: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(auth_service.get_current_user),
):
    """Create a new subscription."""
    services = init_services(db)
    return await services["subscription_service"].create_subscription(
        current_user, subscription.plan_id, db
    )


@router.get("/current", response_model=SubscriptionResponse)
async def get_current_subscription(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(auth_service.get_current_user),
):
    """Get current user's subscription."""
    services = init_services(db)
    return await services["subscription_service"].get_user_subscription(
        current_user.id, db
    )


@router.post("/cancel", response_model=SubscriptionResponse)
async def cancel_subscription(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(auth_service.get_current_user),
):
    """Cancel current subscription."""
    services = init_services(db)
    subscription = await services["subscription_service"].get_user_subscription(
        current_user.id, db
    )
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No active subscription found"
        )
    return await services["subscription_service"].update_subscription_status(
        subscription.id, "cancelled", db
    )


@router.post("/checkout")
async def create_checkout_session(
    plan: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(auth_service.get_current_user),
):
    """Create a Stripe checkout session for subscription."""
    services = init_services(db)
    return await services["subscription_service"].create_checkout_session(plan)


@router.post("/payment-link")
async def create_payment_link(
    plan: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(auth_service.get_current_user),
):
    """Create a Stripe payment link for subscription."""
    services = init_services(db)
    return await services["subscription_service"].create_payment_link(plan)


@router.get("/plans/{plan_type}", response_model=SubscriptionPlanResponse)
async def get_plan_by_type(plan_type: PlanType, db: Session = Depends(get_db)):
    """Get a subscription plan by type."""
    services = init_services(db)
    plan = await services["subscription_service"].get_plan_by_type(plan_type, db)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found"
        )
    return plan


@router.get("/subscription/usage", response_model=dict)
async def get_subscription_usage(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(auth_service.get_current_user),
):
    """Get the current user's subscription usage."""
    services = init_services(db)
    subscription = await services["subscription_service"].get_user_subscription(
        current_user.id, db
    )
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=NO_ACTIVE_SUBSCRIPTION
        )

    plan = await services["subscription_service"].get_plan(subscription.plan_id, db)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=PLAN_NOT_FOUND
        )

    return {
        "api_calls_remaining": subscription.api_calls_remaining,
        "api_calls_limit": plan.api_calls_limit,
        "rate_limit": plan.rate_limit,
        "current_period_end": subscription.current_period_end,
    }


@router.get("/api/subscription/usage")
async def get_subscription_usage(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user),
):
    """Get the current user's subscription usage data for the dashboard."""
    subscription_service = SubscriptionService(db)

    # Get user's subscription
    subscription = await subscription_service.get_user_subscription(current_user.id)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No active subscription found"
        )

    # Get plan details
    plan = await subscription_service.get_plan(subscription.plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Subscription plan not found"
        )

    return {
        "api_calls_remaining": subscription.api_calls_remaining,
        "api_calls_limit": plan.api_calls_limit,
        "rate_limit": plan.rate_limit,
        "current_period_end": subscription.current_period_end.isoformat(),
        "plan_type": plan.plan_type,
        "features": plan.features,
    }
