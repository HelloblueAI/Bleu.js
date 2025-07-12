import json
import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

import stripe
from fastapi import Depends, HTTPException, status
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

from ..config import settings
from ..constants import NO_ACTIVE_SUBSCRIPTION, SUBSCRIPTION_NOT_FOUND
from ..database import get_db
from ..models import Payment
from .email_service import EmailService
from .monitoring_service import MonitoringService
from .stripe_service import StripeService

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

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

# Error messages

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


class SubscriptionService:
    """Service for managing API subscriptions and usage tracking."""

    def __init__(
        self,
        db: Session = Depends(get_db),
        stripe_service: Optional[StripeService] = None,
    ):
        self.db = db
        self.settings = settings
        self.stripe = stripe
        self.email_service = EmailService()
        self.monitoring_service = MonitoringService()
        self.api_service = APIService(db)
        self.stripe_service = stripe_service or StripeService()

        # Plan features and pricing
        self.plan_features = {
            "cor-e": {
                "name": "COR-E",
                "price_lookup_key": "core_monthly",
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
                "price_lookup_key": "enterprise_monthly",
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

    async def get_subscription_plans(self) -> List[Dict]:
        """Get available subscription plans."""
        return list(self.subscription_plans.values())

    async def get_subscription(self, user_id: str) -> Optional[Dict]:
        """Get user's subscription."""
        try:
            # Retrieve subscription from Stripe
            customer = await self.stripe.Customer.list(email=user_id)
            if not customer.data:
                return None

            subscriptions = await self.stripe.Subscription.list(
                customer=customer.data[0].id
            )
            if not subscriptions.data:
                return None

            subscription = subscriptions.data[0]
            return {
                "id": subscription.id,
                "tier": subscription.metadata.get("tier", "basic"),
                "status": subscription.status,
                "current_period_end": datetime.fromtimestamp(
                    subscription.current_period_end, timezone.utc
                ),
                "cancel_at_period_end": subscription.cancel_at_period_end,
            }
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def get_subscription_usage(self, user_id: str) -> Dict:
        """Get subscription usage metrics."""
        try:
            subscription = await self.get_subscription(user_id)
            if not subscription:
                raise HTTPException(
                    status_code=404, detail=ERROR_MESSAGES["NO_SUBSCRIPTION"]
                )

            # Get usage from Stripe
            usage_record = await self.stripe.SubscriptionItem.retrieve_usage_record(
                subscription["id"],
                timestamp=int(datetime.now(timezone.utc).timestamp()),
                action="increment",
            )

            return {
                "requests": usage_record.quantity,
                "quota": self.subscription_plans[subscription["tier"]]["monthly_calls"],
                "reset_at": datetime.fromtimestamp(
                    usage_record.timestamp, timezone.utc
                ),
            }
        except HTTPException:
            raise
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def upgrade_subscription(self, user_id: str, tier: str) -> Dict:
        """Upgrade subscription plan."""
        try:
            if tier not in self.subscription_plans:
                raise HTTPException(
                    status_code=400, detail=ERROR_MESSAGES["INVALID_TIER"]
                )

            subscription = await self.get_subscription(user_id)
            if not subscription:
                raise HTTPException(
                    status_code=404, detail=ERROR_MESSAGES["NO_SUBSCRIPTION"]
                )

            # Update subscription in Stripe
            updated_subscription = await self.stripe.Subscription.modify(
                subscription["id"],
                metadata={"tier": tier},
                items=[
                    {
                        "id": subscription["id"],
                        "price": self.subscription_plans[tier]["stripe_price_id"],
                        "quantity": 1,
                    }
                ],
            )

            return {
                "tier": tier,
                "expires_at": datetime.fromtimestamp(
                    updated_subscription.current_period_end, timezone.utc
                ),
            }
        except HTTPException:
            raise
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def renew_subscription(self, user_id: str) -> Dict:
        """Renew subscription."""
        try:
            subscription = await self.get_subscription(user_id)
            if not subscription:
                raise HTTPException(
                    status_code=404, detail=ERROR_MESSAGES["NO_SUBSCRIPTION"]
                )

            # Cancel any scheduled cancellation in Stripe
            updated_subscription = await self.stripe.Subscription.modify(
                subscription["id"], cancel_at_period_end=False
            )

            return {
                "tier": subscription["tier"],
                "expires_at": datetime.fromtimestamp(
                    updated_subscription.current_period_end, timezone.utc
                ),
            }
        except HTTPException:
            raise
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def track_usage(self, user_id: str, amount: int) -> None:
        """Track API usage."""
        try:
            subscription = await self.get_subscription(user_id)
            if not subscription:
                raise HTTPException(
                    status_code=404, detail=ERROR_MESSAGES["NO_SUBSCRIPTION"]
                )

            if amount <= 0:
                raise HTTPException(
                    status_code=400, detail=ERROR_MESSAGES["INVALID_AMOUNT"]
                )

            # Record usage in Stripe
            await self.stripe.SubscriptionItem.create_usage_record(
                subscription["id"],
                quantity=amount,
                timestamp=int(datetime.now(timezone.utc).timestamp()),
                action="increment",
            )
        except HTTPException:
            raise
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def create_checkout_session(self, plan: str) -> Dict:
        """Create a Stripe checkout session for subscription."""
        try:
            if plan not in self.plan_features:
                raise ValueError(f"Invalid plan: {plan}")

            # Get price ID using lookup key
            price = stripe.Price.list(
                lookup_key=self.plan_features[plan]["price_lookup_key"], limit=1
            )
            if not price.data:
                raise ValueError(f"Price not found for plan: {plan}")

            price_id = price.data[0].id

            # Create checkout session
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[
                    {
                        "price": price_id,
                        "quantity": 1,
                    }
                ],
                mode="subscription",
                success_url=(
                    "https://your-domain.com/success?session_id={CHECKOUT_SESSION_ID}"
                ),
                cancel_url="https://your-domain.com/cancel",
                metadata={"plan": plan},
            )

            return session

        except Exception as e:
            logger.error(f"Error creating checkout session: {str(e)}")
            raise

    async def handle_subscription_created(self, subscription: Dict) -> None:
        """Handle new subscription creation."""
        try:
            customer_id = subscription["customer"]
            plan = subscription["metadata"]["plan"]
            features = self.plan_features[plan]

            # Create customer account with appropriate features
            await self._setup_customer_account(customer_id, plan, features)

            # Send welcome email with API keys and documentation
            await self._send_welcome_email(customer_id, plan)

            # Set up monitoring for the customer
            await self._setup_monitoring(customer_id, plan)

            logger.info(f"Successfully set up subscription for customer {customer_id}")
        except Exception as e:
            logger.error(f"Error handling subscription creation: {str(e)}")
            raise

    async def _setup_customer_account(
        self, customer_id: str, plan: str, features: Dict
    ) -> None:
        """Set up customer account with appropriate features."""
        try:
            # Generate API keys
            api_key = self._generate_api_key()

            # Store customer data in database
            await self._store_customer_data(
                customer_id,
                {
                    "api_key": api_key,
                    "plan": plan,
                    "features": features,
                    "api_calls_remaining": features["api_calls_limit"],
                    "subscription_start": datetime.now(timezone.utc),
                    "rate_limit": features["rate_limit"],
                },
            )

            # Set up rate limiting
            await self._setup_rate_limiting(customer_id, features["rate_limit"])

        except Exception as e:
            logger.error(f"Error setting up customer account: {str(e)}")
            raise

    async def _send_welcome_email(self, customer_id: str, plan: str) -> None:
        """Send welcome email with API keys and documentation."""
        try:
            customer = self.stripe.Customer.retrieve(customer_id)
            customer_email = customer.email

            # Get API key and documentation
            customer_data = await self._get_customer_data(customer_id)

            # Send welcome email
            await self.email_service.send_welcome_email(
                email=customer_email,
                api_key=customer_data["api_key"],
                plan=plan,
                documentation_url=self._get_documentation_url(plan),
            )
        except Exception as e:
            logger.error(f"Error sending welcome email: {str(e)}")
            raise

    async def _setup_monitoring(self, customer_id: str, plan: str) -> None:
        """Set up monitoring for the customer."""
        try:
            features = self.plan_features[plan]

            # Set up uptime monitoring
            await self.monitoring_service.setup_uptime_monitoring(
                customer_id, uptime_sla=features["uptime_sla"]
            )

            # Set up performance monitoring
            await self.monitoring_service.setup_performance_monitoring(
                customer_id, response_time=features["response_time_sla"]
            )

            # Set up usage monitoring
            await self.monitoring_service.setup_usage_monitoring(
                customer_id, api_calls_limit=features["api_calls_limit"]
            )

        except Exception as e:
            logger.error(f"Error setting up monitoring: {str(e)}")
            raise

    def _generate_api_key(self) -> str:
        """Generate a secure API key."""
        import secrets

        return f"bleu_{secrets.token_urlsafe(32)}"

    async def _store_customer_data(self, customer_id: str, data: Dict) -> None:
        """Store customer data in database."""
        # Implement database storage

    async def _get_customer_data(self, customer_id: str) -> Dict:
        """Retrieve customer data from database."""
        # Implement database retrieval

    def _get_documentation_url(self, plan: str) -> str:
        """Get the appropriate documentation URL based on plan."""
        base_url = "https://docs.bleujs.org"
        return f"{base_url}/{'advanced' if plan == 'enterprise' else 'basic'}"

    async def _setup_rate_limiting(self, customer_id: str, rate_limit: int) -> None:
        """Set up rate limiting for the customer."""
        # Implement rate limiting

    async def validate_api_call(self, api_key: str) -> bool:
        """Validate API call and check limits."""
        try:
            customer_data = await self._get_customer_by_api_key(api_key)
            if not customer_data:
                return False

            # Check API calls limit
            if customer_data["api_calls_remaining"] <= 0:
                return False

            # Update remaining calls
            await self._update_api_calls(customer_data["customer_id"])

            return True
        except Exception as e:
            logger.error(f"Error validating API call: {str(e)}")
            return False

    async def _get_customer_by_api_key(self, api_key: str) -> Optional[Dict]:
        """Get customer data by API key."""
        # Implement API key lookup

    async def _update_api_calls(self, customer_id: str) -> None:
        """Update remaining API calls for customer."""
        # Implement API calls update

    async def create_payment_link(self, plan: str) -> Dict:
        """Create a Stripe payment link for subscription."""
        try:
            if plan not in self.plan_features:
                raise ValueError(f"Invalid plan: {plan}")

            # Get price ID using lookup key
            price = stripe.Price.list(
                lookup_key=self.plan_features[plan]["price_lookup_key"], limit=1
            )
            if not price.data:
                raise ValueError(f"Price not found for plan: {plan}")

            price_id = price.data[0].id

            # Create payment link
            payment_link = stripe.PaymentLink.create(
                line_items=[
                    {
                        "price": price_id,
                        "quantity": 1,
                    }
                ],
                after_completion={
                    "type": "redirect",
                    "redirect": {
                        "url": (
                            "https://bleujs.org/success?session_id="
                            "{CHECKOUT_SESSION_ID}"
                        )
                    },
                },
                allow_promotion_codes=True,
                billing_address_collection="required",
                customer_creation="always",
                metadata={"plan": plan},
            )

            return {
                "url": payment_link.url,
                "plan": plan,
                "price": price.data[0].unit_amount
                / 100,  # Convert from cents to dollars
            }

        except Exception as e:
            logger.error(f"Error creating payment link: {str(e)}")
            raise

    @staticmethod
    async def create_plan(
        plan: SubscriptionPlanCreate, db: Session
    ) -> SubscriptionPlan:
        """Create a new subscription plan."""
        db_plan = SubscriptionPlan(id=str(uuid.uuid4()), **plan.dict())
        db.add(db_plan)
        db.commit()
        db.refresh(db_plan)
        return db_plan

    @staticmethod
    async def get_plan_static(plan_id: str, db: Session) -> Optional[SubscriptionPlan]:
        """Get a subscription plan by ID (static method)."""
        return db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()

    @staticmethod
    async def get_plan_by_type_static(
        plan_type: PlanType, db: Session
    ) -> Optional[SubscriptionPlan]:
        """Get a subscription plan by type (static method)."""
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
        stripe_subscription_id: Optional[str] = None,
    ) -> Subscription:
        """Create a new subscription for a user (static method)."""
        plan = await SubscriptionService.get_plan_static(plan_id, db)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found"
            )

        # Check if user already has an active subscription
        existing_subscription = (
            db.query(Subscription)
            .filter(Subscription.user_id == user.id, Subscription.status == "active")
            .first()
        )

        if existing_subscription:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has an active subscription",
            )

        # Create new subscription
        current_time = datetime.now(timezone.utc)
        db_subscription = Subscription(
            id=str(uuid.uuid4()),
            user_id=user.id,
            plan_id=plan_id,
            stripe_subscription_id=stripe_subscription_id,
            status="active",
            current_period_start=current_time,
            current_period_end=current_time + timedelta(days=30),
            api_calls_remaining=plan.api_calls_limit,
        )
        db.add(db_subscription)
        db.commit()
        db.refresh(db_subscription)
        return db_subscription

    @staticmethod
    async def get_user_subscription_static(
        user_id: str, db: Session
    ) -> Optional[Subscription]:
        """Get the active subscription for a user (static method)."""
        subscription = (
            db.query(Subscription)
            .filter(Subscription.user_id == user_id, Subscription.status == "active")
            .first()
        )
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=NO_ACTIVE_SUBSCRIPTION
            )
        return subscription

    @staticmethod
    async def update_subscription_status(
        subscription_id: str, status: str, db: Session
    ) -> Optional[Subscription]:
        """Update the status of a subscription."""
        subscription = (
            db.query(Subscription).filter(Subscription.id == subscription_id).first()
        )
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=SUBSCRIPTION_NOT_FOUND
            )
        subscription.status = status
        db.commit()
        return subscription

    @staticmethod
    async def decrement_api_calls(
        subscription_id: str, db: Session, amount: int = 1
    ) -> Optional[Subscription]:
        """Decrement the remaining API calls for a subscription."""
        subscription = (
            db.query(Subscription).filter(Subscription.id == subscription_id).first()
        )
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=SUBSCRIPTION_NOT_FOUND
            )
        if subscription.api_calls_remaining < amount:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="API call limit exceeded",
            )
        subscription.api_calls_remaining -= amount
        db.commit()
        db.refresh(subscription)
        return subscription

    @staticmethod
    async def reset_api_calls(
        subscription_id: str, db: Session
    ) -> Optional[Subscription]:
        """Reset the API calls for a subscription to its plan limit."""
        subscription = (
            db.query(Subscription).filter(Subscription.id == subscription_id).first()
        )
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=SUBSCRIPTION_NOT_FOUND
            )
        plan = await SubscriptionService.get_plan(subscription.plan_id, db)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found"
            )
        subscription.api_calls_remaining = plan.api_calls_limit
        db.commit()
        db.refresh(subscription)
        return subscription

    async def check_api_access(
        self, user_id: str, service_type: str, db: Session
    ) -> bool:
        """Check if a user has access to a specific API service."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.subscription:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=ERROR_MESSAGES["NO_SUBSCRIPTION"],
            )

        subscription = user.subscription
        if subscription.status not in ["active", "trial"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=ERROR_MESSAGES["INVALID_STATUS"],
            )

        # Check if service is available in the plan
        plan_features = self.plan_features[subscription.plan.plan_type.value][
            "features"
        ]
        if service_type not in plan_features:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Service {service_type} not available in current plan",
            )

        # Check rate limit
        await self.monitoring_service.check_rate_limit(
            user_id, subscription.plan.plan_type.value
        )

        # Check and update API call quota
        if subscription.api_calls_remaining <= 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=ERROR_MESSAGES["QUOTA_EXCEEDED"],
            )

        # Track the API call
        await self.monitoring_service.track_api_call(
            user_id,
            subscription.plan.plan_type.value,
            subscription.api_calls_remaining,
            service_type,
        )

        # Update remaining calls
        subscription.api_calls_remaining -= 1
        db.commit()

        return True

    async def get_user_subscription(self, user_id: str) -> Optional[Subscription]:
        """Get the active subscription for a user."""
        return (
            self.db.query(Subscription)
            .filter(Subscription.user_id == user_id, Subscription.status == "active")
            .first()
        )

    async def get_plan(self, plan_id: str) -> Optional[SubscriptionPlan]:
        """Get a subscription plan by ID."""
        return (
            self.db.query(SubscriptionPlan)
            .filter(SubscriptionPlan.id == plan_id)
            .first()
        )

    async def get_plan_by_type(self, plan_type: str) -> Optional[SubscriptionPlan]:
        """Get a subscription plan by type."""
        return (
            self.db.query(SubscriptionPlan)
            .filter(SubscriptionPlan.plan_type == plan_type)
            .first()
        )

    async def create_subscription(
        self, user: User, plan_type: str, payment_method_id: str
    ) -> Subscription:
        """Create a new subscription for user"""
        try:
            # Create or update Stripe customer
            if not user.stripe_customer_id:
                customer = self.stripe.Customer.create(
                    email=user.email,
                    payment_method=payment_method_id,
                    invoice_settings={"default_payment_method": payment_method_id},
                )
                user.stripe_customer_id = customer.id
                self.db.commit()

            # Get plan details
            plan_details = self.get_plan_details(plan_type)

            # Create Stripe subscription
            subscription = self.stripe.Subscription.create(
                customer=user.stripe_customer_id,
                items=[{"price": plan_details["stripe_price_id"]}],
                trial_period_days=30,
                metadata={"user_id": str(user.id), "plan_type": plan_type},
            )

            # Create subscription in database
            db_subscription = Subscription(
                user_id=user.id,
                plan_type=plan_type,
                stripe_subscription_id=subscription.id,
                current_period_start=datetime.fromtimestamp(
                    subscription.current_period_start
                ),
                current_period_end=datetime.fromtimestamp(
                    subscription.current_period_end
                ),
                api_calls_limit=plan_details["api_calls_limit"],
                rate_limit=plan_details["rate_limit"],
                features=json.dumps(plan_details["features"]),
                status="active",
            )
            self.db.add(db_subscription)
            self.db.commit()

            # Update metrics
            subscription_updates.inc()
            active_subscriptions.labels(plan_type=plan_type).inc()

            # Send welcome email
            await self.email_service.send_welcome_email(
                user.email, plan_type, user.api_key, plan_details["features"]
            )

            return db_subscription

        except stripe.error.StripeError as e:
            self.logger.error(f"Stripe error: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            self.logger.error(f"Subscription creation error: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create subscription")

    async def update_subscription(self, user: User, new_plan_type: str) -> Subscription:
        """Update user's subscription to a new plan"""
        try:
            subscription = (
                self.db.query(Subscription)
                .filter(
                    Subscription.user_id == user.id, Subscription.status == "active"
                )
                .first()
            )

            if not subscription:
                raise HTTPException(
                    status_code=404, detail="No active subscription found"
                )

            # Get new plan details
            new_plan_details = self.get_plan_details(new_plan_type)

            # Update Stripe subscription
            stripe_subscription = self.stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                items=[{"price": new_plan_details["stripe_price_id"]}],
                proration_behavior="always_invoice",
            )

            # Update subscription in database
            subscription.plan_type = new_plan_type
            subscription.api_calls_limit = new_plan_details["api_calls_limit"]
            subscription.rate_limit = new_plan_details["rate_limit"]
            subscription.features = json.dumps(new_plan_details["features"])
            subscription.current_period_end = datetime.fromtimestamp(
                stripe_subscription.current_period_end
            )
            self.db.commit()

            # Update metrics
            subscription_updates.inc()
            active_subscriptions.labels(plan_type=new_plan_type).inc()

            # Send plan update email
            await self.email_service.send_plan_update_email(
                user.email, new_plan_type, new_plan_details["features"]
            )

            return subscription

        except stripe.error.StripeError as e:
            self.logger.error(f"Stripe error: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            self.logger.error(f"Subscription update error: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update subscription")

    async def cancel_subscription(self, user: User) -> Subscription:
        """Cancel user's subscription"""
        try:
            subscription = (
                self.db.query(Subscription)
                .filter(
                    Subscription.user_id == user.id, Subscription.status == "active"
                )
                .first()
            )

            if not subscription:
                raise HTTPException(status_code=404, detail=NO_ACTIVE_SUBSCRIPTION)

            # Cancel Stripe subscription
            self.stripe.Subscription.delete(subscription.stripe_subscription_id)

            # Update subscription in database
            subscription.status = "cancelled"
            subscription.cancelled_at = datetime.now(timezone.utc)
            self.db.commit()

            # Update metrics
            subscription_updates.inc()
            active_subscriptions.labels(plan_type=subscription.plan_type).dec()

            # Send cancellation email
            await self.email_service.send_cancellation_email(user.email)

            return subscription

        except stripe.error.StripeError as e:
            self.logger.error(f"Stripe error: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            self.logger.error(f"Subscription cancellation error: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to cancel subscription")

    async def process_payment(self, payment_intent_id: str) -> Payment:
        """Process a payment for subscription"""
        try:
            payment_intent = self.stripe.PaymentIntent.retrieve(payment_intent_id)

            # Create payment record
            payment = Payment(
                user_id=payment_intent.metadata.get("user_id"),
                amount=payment_intent.amount,
                currency=payment_intent.currency,
                status=payment_intent.status,
                payment_method=payment_intent.payment_method_types[0],
                stripe_payment_id=payment_intent.id,
                created_at=datetime.fromtimestamp(payment_intent.created),
            )
            self.db.add(payment)
            self.db.commit()

            # Update metrics
            payment_processing.inc()

            return payment

        except stripe.error.StripeError as e:
            self.logger.error(f"Stripe error: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            self.logger.error(f"Payment processing error: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to process payment")

    def get_plan_details(self, plan_type: str) -> Dict:
        """Get details for a subscription plan"""
        plans = {
            "COR-E": {
                "stripe_price_id": settings.STRIPE_CORE_PRICE_ID,
                "api_calls_limit": 100,
                "rate_limit": 10,
                "features": [
                    "Core AI Models",
                    "Basic Feature Analysis",
                    "Performance Metrics",
                    "Usage Analytics",
                    "API Documentation",
                    "Email Support",
                ],
            },
            "ENTERPRISE": {
                "stripe_price_id": settings.STRIPE_ENTERPRISE_PRICE_ID,
                "api_calls_limit": 5000,
                "rate_limit": 100,
                "features": [
                    "Quantum Intelligence",
                    "Market Intelligence",
                    "Strategic Intelligence",
                    "Advanced Feature Analysis",
                    "Performance Tracking",
                    "Custom Model Training",
                    "Priority Support",
                    "Dedicated Account Manager",
                ],
            },
        }

        if plan_type not in plans:
            raise HTTPException(status_code=400, detail="Invalid plan type")

        return plans[plan_type]

    async def get_subscription_analytics(self) -> Dict:
        """Get analytics for all subscriptions"""
        # Get subscription counts by plan
        subscription_counts = {}
        for plan in ["COR-E", "ENTERPRISE"]:
            count = (
                self.db.query(Subscription)
                .filter(Subscription.plan_type == plan, Subscription.status == "active")
                .count()
            )
            subscription_counts[plan] = count

        # Get revenue metrics
        total_revenue = 0
        monthly_revenue = 0
        payments = self.db.query(Payment).filter(Payment.status == "succeeded").all()

        for payment in payments:
            total_revenue += payment.amount
            if payment.created_at >= datetime.now(timezone.utc) - timedelta(days=30):
                monthly_revenue += payment.amount

        # Get churn rate
        total_cancelled = (
            self.db.query(Subscription)
            .filter(Subscription.status == "cancelled")
            .count()
        )
        total_subscriptions = sum(subscription_counts.values())
        churn_rate = (
            (total_cancelled / total_subscriptions) if total_subscriptions > 0 else 0
        )

        return {
            "subscription_counts": subscription_counts,
            "total_revenue": total_revenue,
            "monthly_revenue": monthly_revenue,
            "churn_rate": churn_rate,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    async def get_user_subscription_data(self, user: User) -> Dict:
        """Get detailed subscription data for user"""
        subscription = (
            self.db.query(Subscription)
            .filter(Subscription.user_id == user.id, Subscription.status == "active")
            .first()
        )

        if not subscription:
            raise HTTPException(status_code=404, detail="No active subscription found")

        # Get usage analytics
        usage_analytics = await self.api_service.get_usage_analytics(user)

        # Get payment history
        payments = (
            self.db.query(Payment)
            .filter(Payment.user_id == user.id, Payment.status == "succeeded")
            .order_by(Payment.created_at.desc())
            .limit(5)
            .all()
        )

        return {
            "subscription": {
                "plan_type": subscription.plan_type,
                "current_period_start": subscription.current_period_start,
                "current_period_end": subscription.current_period_end,
                "api_calls_limit": subscription.api_calls_limit,
                "rate_limit": subscription.rate_limit,
                "features": json.loads(subscription.features),
            },
            "usage": usage_analytics,
            "payment_history": [
                {
                    "amount": payment.amount,
                    "currency": payment.currency,
                    "created_at": payment.created_at,
                    "status": payment.status,
                }
                for payment in payments
            ],
        }
