"""Stripe service module."""

import logging
from typing import Dict, Optional

import stripe
from fastapi import HTTPException

from src.config import settings

logger = logging.getLogger(__name__)


class StripeService:
    """Service for handling Stripe payments and subscriptions."""

    def __init__(self):
        """Initialize the Stripe service."""
        stripe.api_key = settings.STRIPE_SECRET_KEY.get_secret_value()

    def create_customer(self, email: str, name: Optional[str] = None) -> Dict:
        """Create a new Stripe customer."""
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
            )
            return customer
        except stripe.error.StripeError as e:
            logger.error(f"Error creating Stripe customer: {e}")
            raise HTTPException(status_code=400, detail=str(e))

    def create_subscription(self, customer_id: str, price_id: str) -> Dict:
        """Create a new subscription for a customer."""
        try:
            subscription = stripe.Subscription.create(
                customer=customer_id,
                items=[{"price": price_id}],
                payment_behavior="default_incomplete",
                expand=["latest_invoice.payment_intent"],
            )
            return subscription
        except stripe.error.StripeError as e:
            logger.error(f"Error creating Stripe subscription: {e}")
            raise HTTPException(status_code=400, detail=str(e))

    def cancel_subscription(self, subscription_id: str) -> Dict:
        """Cancel a subscription."""
        try:
            subscription = stripe.Subscription.delete(subscription_id)
            return subscription
        except stripe.error.StripeError as e:
            logger.error(f"Error canceling Stripe subscription: {e}")
            raise HTTPException(status_code=400, detail=str(e))

    def get_subscription(self, subscription_id: str) -> Dict:
        """Get subscription details."""
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            return subscription
        except stripe.error.StripeError as e:
            logger.error(f"Error retrieving Stripe subscription: {e}")
            raise HTTPException(status_code=400, detail=str(e))

    def update_subscription(self, subscription_id: str, price_id: str) -> Dict:
        """Update a subscription's price."""
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            updated = stripe.Subscription.modify(
                subscription_id,
                items=[
                    {
                        "id": subscription["items"]["data"][0].id,
                        "price": price_id,
                    }
                ],
            )
            return updated
        except stripe.error.StripeError as e:
            logger.error(f"Error updating Stripe subscription: {e}")
            raise HTTPException(status_code=400, detail=str(e))

    def create_payment_intent(self, amount: int, currency: str = "usd") -> Dict:
        """Create a payment intent."""
        try:
            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency=currency,
            )
            return intent
        except stripe.error.StripeError as e:
            logger.error(f"Error creating payment intent: {e}")
            raise HTTPException(status_code=400, detail=str(e))

    def handle_webhook(self, payload: bytes, sig_header: str) -> Dict:
        """Handle Stripe webhook events."""
        try:
            event = stripe.Webhook.construct_event(
                payload,
                sig_header,
                settings.STRIPE_WEBHOOK_SECRET.get_secret_value(),
            )
            return event
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature: {e}")
            raise HTTPException(status_code=400, detail="Invalid signature")
        except Exception as e:
            logger.error(f"Error handling webhook: {e}")
            raise HTTPException(status_code=400, detail="Webhook error")
