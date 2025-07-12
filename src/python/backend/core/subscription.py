"""
Subscription service for managing API access.
"""

from datetime import datetime, timedelta
from typing import Optional, Tuple

from sqlalchemy.orm import Session

from .models import APICallLog, Subscription, SubscriptionTier, UsageStats


class SubscriptionService:
    """Service for managing API subscriptions and usage."""

    # API call limits for each tier
    TIER_LIMITS = {
        SubscriptionTier.FREE: 10,
        SubscriptionTier.REGULAR: 100,
        SubscriptionTier.ENTERPRISE: 5000,
    }

    @classmethod
    def get_or_create_subscription(
        cls, db: Session, user_id: int, tier: SubscriptionTier = SubscriptionTier.FREE
    ) -> Subscription:
        """Get or create a subscription for a user."""
        subscription = (
            db.query(Subscription).filter(Subscription.user_id == user_id).first()
        )

        if not subscription:
            subscription = Subscription(
                user_id=user_id,
                tier=tier,
                api_calls_remaining=cls.TIER_LIMITS[tier],
                api_calls_total=cls.TIER_LIMITS[tier],
                last_reset=datetime.utcnow(),
            )
            db.add(subscription)
            db.commit()
            db.refresh(subscription)

        # Reset subscription if it's been a month since last reset
        if datetime.utcnow() - subscription.last_reset > timedelta(days=30):
            subscription.api_calls_remaining = cls.TIER_LIMITS[subscription.tier]
            subscription.api_calls_total = cls.TIER_LIMITS[subscription.tier]
            subscription.last_reset = datetime.utcnow()
            db.commit()
            db.refresh(subscription)

        return subscription

    @classmethod
    def check_api_access(
        cls, db: Session, user_id: int, endpoint: str, method: str = "GET"
    ) -> Tuple[bool, Optional[str]]:
        """Check if a user has access to make an API call."""
        subscription = cls.get_or_create_subscription(db, user_id)

        if subscription.api_calls_remaining <= 0:
            return False, "API call limit exceeded"

        # Log the API call
        log = APICallLog(
            user_id=user_id,
            endpoint=endpoint,
            method=method,
            status_code=0,  # Will be updated after the call
            response_time=0.0,  # Will be updated after the call
        )
        db.add(log)

        # Decrement remaining calls
        subscription.api_calls_remaining -= 1
        db.commit()

        return True, None

    @classmethod
    def update_api_call_log(
        cls,
        db: Session,
        user_id: int,
        endpoint: str,
        method: str,
        status_code: int,
        response_time: float,
    ) -> None:
        """Update the API call log with response details."""
        log = (
            db.query(APICallLog)
            .filter(
                APICallLog.user_id == user_id,
                APICallLog.endpoint == endpoint,
                APICallLog.method == method,
                APICallLog.status_code == 0,  # Find the most recent uncompleted log
            )
            .order_by(APICallLog.created_at.desc())
            .first()
        )

        if log:
            log.status_code = status_code
            log.response_time = response_time
            db.commit()

    @classmethod
    def get_usage_stats(cls, db: Session, user_id: int) -> UsageStats:
        """Get API usage statistics for a user."""
        subscription = cls.get_or_create_subscription(db, user_id)

        # Get recent API calls
        recent_calls = (
            db.query(APICallLog)
            .filter(APICallLog.user_id == user_id)
            .order_by(APICallLog.created_at.desc())
            .limit(10)
            .all()
        )

        return UsageStats(
            total_calls=subscription.api_calls_total,
            remaining_calls=subscription.api_calls_remaining,
            recent_calls=recent_calls,
            tier=subscription.tier,
            next_reset=subscription.last_reset + timedelta(days=30),
        )
