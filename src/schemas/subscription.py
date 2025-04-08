"""Subscription schemas module."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SubscriptionBase(BaseModel):
    """Base subscription schema."""

    plan_id: str = Field(..., description="Stripe plan ID")
    status: str = Field(..., description="Subscription status")
    current_period_start: datetime = Field(
        ..., description="Start of current billing period"
    )
    current_period_end: datetime = Field(
        ..., description="End of current billing period"
    )
    cancel_at_period_end: bool = Field(
        False, description="Whether to cancel at period end"
    )


class SubscriptionCreate(SubscriptionBase):
    """Schema for creating a subscription."""

    pass


class SubscriptionUpdate(BaseModel):
    """Schema for updating a subscription."""

    plan_id: Optional[str] = Field(None, description="Stripe plan ID")
    status: Optional[str] = Field(None, description="Subscription status")
    cancel_at_period_end: Optional[bool] = Field(
        None, description="Whether to cancel at period end"
    )


class SubscriptionInDB(SubscriptionBase):
    """Schema for subscription in database."""

    id: int = Field(..., description="Subscription ID")
    user_id: int = Field(..., description="User ID")
    stripe_subscription_id: str = Field(..., description="Stripe subscription ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    class Config:
        """Pydantic config."""

        from_attributes = True


class Subscription(SubscriptionInDB):
    """Schema for subscription response."""

    pass


class SubscriptionResponse(BaseModel):
    """Schema for subscription API response."""

    subscription: Subscription = Field(..., description="Subscription details")
    message: str = Field(..., description="Response message")
    status: str = Field(..., description="Response status")
