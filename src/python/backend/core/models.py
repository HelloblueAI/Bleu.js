"""
Core models for the Bleu.js application.
"""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class SubscriptionTier(str, Enum):
    """Subscription tiers for API access."""

    FREE = "free"
    REGULAR = "regular"
    ENTERPRISE = "enterprise"


class Subscription(BaseModel):
    """Subscription model for API access."""

    id: int
    user_id: int
    tier: SubscriptionTier
    api_calls_remaining: int
    created_at: datetime
    updated_at: datetime
    last_reset: datetime


class APICallLog(BaseModel):
    """Log entry for API calls."""

    id: int
    user_id: int
    endpoint: str
    method: str
    status_code: int
    response_time: float
    created_at: datetime


class UsageStats(BaseModel):
    """Statistics for API usage."""

    total_calls: int
    remaining_calls: int
    recent_calls: list[APICallLog]
    tier: SubscriptionTier
    next_reset: datetime


class Job(BaseModel):
    """Job model for processing tasks."""

    id: int
    user_id: int
    job_type: str
    status: str
    created_at: datetime
    updated_at: datetime
    result: Optional[dict] = None
    error: Optional[str] = None
