"""Subscription routes module."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.middleware.auth import get_current_user
from src.models.subscription import Subscription
from src.models.user import User
from src.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionResponse,
    SubscriptionUpdate,
)
from src.services.stripe_service import StripeService
from src.services.subscription_service import SubscriptionService

# Constants
SUBSCRIPTION_NOT_FOUND_MESSAGE = "Subscription not found"

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.post("/", response_model=SubscriptionResponse)
def create_subscription(
    subscription_data: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Subscription:
    """Create a new subscription."""
    subscription_service = SubscriptionService(db, StripeService())
    return subscription_service.create_subscription(
        current_user, subscription_data.plan_type, subscription_data.payment_method_id
    )


@router.get("/", response_model=List[SubscriptionResponse])
def get_subscriptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[Subscription]:
    """Get all subscriptions for the current user."""
    subscription_service = SubscriptionService(db, StripeService())
    return subscription_service.get_user_subscriptions(current_user.id)


@router.get("/active", response_model=SubscriptionResponse)
def get_active_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Subscription:
    """Get the active subscription for the current user."""
    subscription_service = SubscriptionService(db, StripeService())
    subscription = subscription_service.get_active_subscription(current_user.id)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found",
        )
    return subscription


@router.get("/{subscription_id}", response_model=SubscriptionResponse)
def get_subscription(
    subscription_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Subscription:
    """Get a subscription by ID."""
    subscription_service = SubscriptionService(db, StripeService())
    subscription = subscription_service.get_subscription(subscription_id)
    if not subscription or subscription.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=SUBSCRIPTION_NOT_FOUND_MESSAGE,
        )
    return subscription


@router.put("/{subscription_id}", response_model=SubscriptionResponse)
def update_subscription(
    subscription_id: int,
    subscription_data: SubscriptionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Subscription:
    """Update a subscription."""
    subscription_service = SubscriptionService(db, StripeService())
    subscription = subscription_service.get_subscription(subscription_id)
    if not subscription or subscription.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=SUBSCRIPTION_NOT_FOUND_MESSAGE,
        )
    return subscription_service.update_subscription(subscription_id, subscription_data)


@router.delete("/{subscription_id}", response_model=SubscriptionResponse)
def cancel_subscription(
    subscription_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Subscription:
    """Cancel a subscription."""
    subscription_service = SubscriptionService(db, StripeService())
    subscription = subscription_service.get_subscription(subscription_id)
    if not subscription or subscription.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=SUBSCRIPTION_NOT_FOUND_MESSAGE,
        )
    return subscription_service.cancel_subscription(subscription_id)
