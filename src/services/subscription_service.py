import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import Depends, HTTPException
from prometheus_client import Counter, Gauge
from sqlalchemy.orm import Session

from src.models.subscription import (
    PlanType,
    Subscription,
    SubscriptionPlan,
    SubscriptionPlanCreate,
)
from src.models.user import User
from src.services.api_service import APIService
from src.utils.base_classes import BaseService

from ..config import settings
from ..database import get_db
from .email_service import EmailService

logger = logging.getLogger(__name__)

# Constants
ERROR_MESSAGES = {
    "NO_SUBSCRIPTION": "No subscription found",
    "INVALID_TIER": "Invalid subscription tier",
    "INVALID_STATUS": "Invalid subscription status",
    "INVALID_AMOUNT": "Invalid usage amount",
    "INVALID_DATE": "Invalid date format",
    "QUOTA_EXCEEDED": "API call quota exceeded",
    "RATE_LIMIT_EXCEEDED": "Rate limit exceeded",
}

# Prometheus metrics
subscription_updates = Counter(
    "subscription_updates_total", "Total number of subscription updates"
)
payment_processing = Counter(
    "payment_processing_total", "Total number of payment processing attempts"
)
active_subscriptions = Gauge(
    "active_subscriptions", "Number of active subscriptions", ["plan_type"]
)


class SubscriptionService(BaseService):
    """Service for managing API subscriptions and usage tracking."""

    def __init__(self, db: Session = Depends(get_db)):
        super().__init__(db)
        self.settings = settings
        # Initialize services with proper arguments
        self.email_service = EmailService()
        self.api_service = APIService(db)

        # Plan features and pricing
        self.plan_features = {
            "cor-e": {
                "name": "COR-E",
                "api_calls_limit": 100,
                "rate_limit": 10,  # requests per second
                "features": [
                    "quantum_computing",
                    "face_recognition",
                    "scene_recognition",
                    "model_training",
                    "basic_support",
                ],
                "price": 99,  # $99/month
            },
            "enterprise": {
                "name": "Enterprise",
                "api_calls_limit": 5000,
                "rate_limit": 50,  # requests per second
                "features": [
                    "quantum_computing",
                    "face_recognition",
                    "scene_recognition",
                    "model_training",
                    "advanced_analytics",
                    "priority_support",
                    "custom_model_training",
                    "dedicated_support",
                ],
                "price": 999,  # $999/month
            },
        }

        self.subscription_plans = {
            "cor-e": {
                "id": "cor-e",
                "name": "COR-E",
                "price": 29.99,
                "features": [
                    "100 API calls/month",
                    "Core AI model access",
                    "Standard documentation",
                    "Email support",
                    "99.9% uptime SLA",
                    "Standard response time",
                ],
                "status": "active",
            },
            "enterprise": {
                "id": "enterprise",
                "name": "Enterprise Plan",
                "price": 499.99,
                "features": [
                    "5000 API calls/month",
                    "Advanced AI models access",
                    "Premium documentation",
                    "Dedicated support team",
                    "99.99% uptime SLA",
                    "Priority response time",
                    "Custom training",
                ],
                "status": "active",
            },
        }

    async def get_subscription_plans(self) -> list[dict]:
        """Get available subscription plans."""
        return list(self.subscription_plans.values())

    async def get_subscription(self, user_id: str) -> dict | None:
        """Get user's subscription from database."""
        try:
            subscription = await self.get_user_subscription_static(user_id, self.db)
            if not subscription:
                return None

            return {
                "id": str(subscription.id),
                "tier": (
                    subscription.plan.plan_type.value if subscription.plan else "basic"
                ),
                "status": subscription.status,
                "current_period_end": subscription.end_date,
                "cancel_at_period_end": subscription.status == "cancelled",
            }
        except Exception as e:
            logger.error(f"Error getting subscription: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def get_subscription_usage(self, user_id: str) -> dict:
        """Get subscription usage metrics."""
        try:
            subscription = await self.get_subscription(user_id)
            if not subscription:
                raise HTTPException(
                    status_code=404, detail=ERROR_MESSAGES["NO_SUBSCRIPTION"]
                )

            # Get usage from database
            db_subscription = await self.get_user_subscription_static(user_id, self.db)
            if not db_subscription:
                raise HTTPException(
                    status_code=404, detail=ERROR_MESSAGES["NO_SUBSCRIPTION"]
                )

            return {
                "requests": db_subscription.api_calls_used,
                "quota": (
                    db_subscription.plan.api_calls_limit if db_subscription.plan else 0
                ),
                "reset_at": db_subscription.end_date,
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting subscription usage: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def upgrade_subscription(self, user_id: str, tier: str) -> dict:
        """Upgrade user's subscription tier."""
        try:
            if tier not in self.plan_features:
                raise HTTPException(
                    status_code=400, detail=ERROR_MESSAGES["INVALID_TIER"]
                )

            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            # Get current subscription
            current_subscription = await self.get_user_subscription_static(
                user_id, self.db
            )

            # Get plan
            plan = await self.get_plan_by_type_static(PlanType(tier), self.db)
            if not plan:
                raise HTTPException(status_code=404, detail="Plan not found")

            if current_subscription:
                # Update existing subscription
                current_subscription.plan_id = plan.id
                current_subscription.status = "active"
                current_subscription.start_date = datetime.now(timezone.utc)
                current_subscription.end_date = datetime.now(timezone.utc) + timedelta(
                    days=30
                )
                self.db.commit()
                subscription = current_subscription
            else:
                # Create new subscription
                subscription = await self.create_subscription_static(
                    user, str(plan.id), self.db
                )

            subscription_updates.inc()
            active_subscriptions.labels(plan_type=tier).inc()

            return {
                "id": str(subscription.id),
                "tier": tier,
                "status": subscription.status,
                "message": f"Successfully upgraded to {tier} plan",
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error upgrading subscription: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def renew_subscription(self, user_id: str) -> dict:
        """Renew user's subscription."""
        try:
            subscription = await self.get_user_subscription_static(user_id, self.db)
            if not subscription:
                raise HTTPException(
                    status_code=404, detail=ERROR_MESSAGES["NO_SUBSCRIPTION"]
                )

            subscription.end_date = datetime.now(timezone.utc) + timedelta(days=30)
            subscription.status = "active"
            subscription.api_calls_used = 0
            self.db.commit()

            subscription_updates.inc()

            return {
                "id": str(subscription.id),
                "status": subscription.status,
                "message": "Subscription renewed successfully",
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error renewing subscription: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def track_usage(self, user_id: str, amount: int) -> None:
        """Track API usage for user."""
        try:
            subscription = await self.get_user_subscription_static(user_id, self.db)
            if not subscription:
                raise HTTPException(
                    status_code=404, detail=ERROR_MESSAGES["NO_SUBSCRIPTION"]
                )

            if subscription.api_calls_used + amount > subscription.plan.api_calls_limit:
                raise HTTPException(
                    status_code=429, detail=ERROR_MESSAGES["QUOTA_EXCEEDED"]
                )

            subscription.api_calls_used += amount
            self.db.commit()

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error tracking usage: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def validate_api_call(self, api_key: str) -> bool:
        """Validate API call against subscription limits."""
        try:
            # Get user by API key
            user = self.db.query(User).filter(User.api_key == api_key).first()
            if not user:
                return False

            subscription = await self.get_user_subscription_static(
                str(user.id), self.db
            )
            if not subscription or subscription.status != "active":
                return False

            # Check usage limits
            if subscription.api_calls_used >= subscription.plan.api_calls_limit:
                return False

            return True
        except Exception as e:
            logger.error(f"Error validating API call: {e}")
            return False

    @staticmethod
    async def create_plan(
        plan: SubscriptionPlanCreate, db: Session
    ) -> SubscriptionPlan:
        """Create a new subscription plan."""
        db_plan = SubscriptionPlan(**plan.dict())
        db.add(db_plan)
        db.commit()
        db.refresh(db_plan)
        return db_plan

    @staticmethod
    async def get_plan_static(plan_id: str, db: Session) -> SubscriptionPlan | None:
        """Get plan by ID."""
        return db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()

    @staticmethod
    async def get_plan_by_type_static(
        plan_type: PlanType, db: Session
    ) -> SubscriptionPlan | None:
        """Get plan by type."""
        return (
            db.query(SubscriptionPlan)
            .filter(SubscriptionPlan.plan_type == plan_type)
            .first()
        )

    @staticmethod
    async def create_subscription_static(
        user: User,
        plan_id: str,
        db: Session,
        stripe_subscription_id: str | None = None,
    ) -> Subscription:
        """Create a new subscription."""
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")

        subscription = Subscription(
            user_id=user.id,
            plan_id=plan.id,
            status="active",
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc) + timedelta(days=30),
            api_calls_used=0,
            stripe_subscription_id=stripe_subscription_id,
        )
        db.add(subscription)
        db.commit()
        db.refresh(subscription)
        return subscription

    @staticmethod
    async def get_user_subscription_static(
        user_id: str, db: Session
    ) -> Subscription | None:
        """Get user's active subscription."""
        return (
            db.query(Subscription)
            .filter(
                Subscription.user_id == user_id,
                Subscription.status == "active",
            )
            .first()
        )

    @staticmethod
    async def update_subscription_status(
        subscription_id: str, status: str, db: Session
    ) -> Subscription | None:
        """Update subscription status."""
        subscription = (
            db.query(Subscription).filter(Subscription.id == subscription_id).first()
        )
        if subscription:
            subscription.status = status
            db.commit()
            db.refresh(subscription)
        return subscription

    @staticmethod
    async def decrement_api_calls(
        subscription_id: str, db: Session, amount: int = 1
    ) -> Subscription | None:
        """Decrement API calls for subscription."""
        subscription = (
            db.query(Subscription).filter(Subscription.id == subscription_id).first()
        )
        if subscription:
            subscription.api_calls_used += amount
            db.commit()
            db.refresh(subscription)
        return subscription

    @staticmethod
    async def reset_api_calls(subscription_id: str, db: Session) -> Subscription | None:
        """Reset API calls for subscription."""
        subscription = (
            db.query(Subscription).filter(Subscription.id == subscription_id).first()
        )
        if subscription:
            subscription.api_calls_used = 0
            db.commit()
            db.refresh(subscription)
        return subscription

    async def check_api_access(
        self, user_id: str, service_type: str, db: Session
    ) -> bool:
        """Check if user has access to specific API service."""
        try:
            subscription = await self.get_user_subscription_static(user_id, db)
            if not subscription or subscription.status != "active":
                return False

            # Check if service is available in user's plan
            plan_features = self.plan_features.get(
                subscription.plan.plan_type.value if subscription.plan else "basic", {}
            )
            available_features = plan_features.get("features", [])

            if service_type not in available_features:
                return False

            # Check usage limits
            if subscription.api_calls_used >= subscription.plan.api_calls_limit:
                return False

            return True
        except Exception as e:
            logger.error(f"Error checking API access: {e}")
            return False

    async def get_user_subscription(self, user_id: str) -> Subscription | None:
        """Get user's subscription."""
        return await self.get_user_subscription_static(user_id, self.db)

    async def get_plan(self, plan_id: str) -> SubscriptionPlan | None:
        """Get plan by ID."""
        return await self.get_plan_static(plan_id, self.db)

    async def get_plan_by_type(self, plan_type: str) -> SubscriptionPlan | None:
        """Get plan by type."""
        return await self.get_plan_by_type_static(PlanType(plan_type), self.db)

    async def create_subscription(
        self, user: User, plan_type: str, payment_method_id: str
    ) -> Subscription:
        """Create a new subscription."""
        plan = await self.get_plan_by_type(plan_type)
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")

        return await self.create_subscription_static(user, str(plan.id), self.db)

    async def update_subscription(self, user: User, new_plan_type: str) -> Subscription:
        """Update user's subscription."""
        current_subscription = await self.get_user_subscription_static(
            str(user.id), self.db
        )
        if not current_subscription:
            raise HTTPException(status_code=404, detail="No active subscription found")

        new_plan = await self.get_plan_by_type(new_plan_type)
        if not new_plan:
            raise HTTPException(status_code=404, detail="Plan not found")

        current_subscription.plan_id = new_plan.id
        current_subscription.status = "active"
        self.db.commit()
        self.db.refresh(current_subscription)

        return current_subscription

    async def cancel_subscription(self, user: User) -> Subscription:
        """Cancel user's subscription."""
        subscription = await self.get_user_subscription_static(str(user.id), self.db)
        if not subscription:
            raise HTTPException(status_code=404, detail="No active subscription found")

        subscription.status = "cancelled"
        self.db.commit()
        self.db.refresh(subscription)

        return subscription

    def get_plan_details(self, plan_type: str) -> dict:
        """Get plan details."""
        plan_info = self.plan_features.get(plan_type, {})
        return {
            "name": plan_info.get("name", plan_type),
            "price": plan_info.get("price", 0),
            "api_calls_limit": plan_info.get("api_calls_limit", 0),
            "rate_limit": plan_info.get("rate_limit", 0),
            "features": plan_info.get("features", []),
        }

    async def get_subscription_analytics(self) -> dict:
        """Get subscription analytics."""
        try:
            total_subscriptions = self.db.query(Subscription).count()
            active_subscriptions = (
                self.db.query(Subscription)
                .filter(Subscription.status == "active")
                .count()
            )
            cancelled_subscriptions = (
                self.db.query(Subscription)
                .filter(Subscription.status == "cancelled")
                .count()
            )

            return {
                "total_subscriptions": total_subscriptions,
                "active_subscriptions": active_subscriptions,
                "cancelled_subscriptions": cancelled_subscriptions,
                "conversion_rate": (
                    (active_subscriptions / total_subscriptions * 100)
                    if total_subscriptions > 0
                    else 0
                ),
            }
        except Exception as e:
            logger.error(f"Error getting subscription analytics: {e}")
            return {}

    async def get_user_subscription_data(self, user: User) -> dict:
        """Get comprehensive subscription data for user."""
        try:
            subscription = await self.get_user_subscription_static(
                str(user.id), self.db
            )
            if not subscription:
                return {"has_subscription": False}

            plan_details = self.get_plan_details(
                subscription.plan.plan_type.value if subscription.plan else "basic"
            )

            return {
                "has_subscription": True,
                "subscription_id": str(subscription.id),
                "plan_type": (
                    subscription.plan.plan_type.value if subscription.plan else "basic"
                ),
                "status": subscription.status,
                "start_date": subscription.start_date,
                "end_date": subscription.end_date,
                "api_calls_used": subscription.api_calls_used,
                "api_calls_limit": plan_details.get("api_calls_limit", 0),
                "plan_details": plan_details,
            }
        except Exception as e:
            logger.error(f"Error getting user subscription data: {e}")
            return {"has_subscription": False}

    def execute(self, *args, **kwargs) -> Any:
        """Execute subscription service operation.

        Args:
            *args: Variable length argument list
            **kwargs: Arbitrary keyword arguments

        Returns:
            Any: Result of the subscription operation
        """
        # Default implementation - can be overridden by subclasses
        return {"status": "subscription_processed", "service": "subscription"}
