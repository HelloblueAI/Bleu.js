from datetime import datetime, timezone
from typing import Dict, Optional

import stripe
from fastapi import HTTPException


# Custom exceptions
class PaymentError(Exception):
    """Base exception for payment-related errors."""

    pass


class PaymentValidationError(PaymentError):
    """Raised when payment validation fails."""

    pass


class PaymentProcessingError(PaymentError):
    """Raised when payment processing fails."""

    pass


class PaymentService:
    def __init__(self, api_key: str):
        """Initialize the payment service with Stripe API key."""
        stripe.api_key = api_key

        # Define subscription plans
        self.SUBSCRIPTION_PLANS = {
            "basic": {
                "stripe_price_id": "price_basic",  # Replace with actual Stripe price ID
                "name": "Basic Plan",
                "price": 29,
                "api_calls": 100,
            },
            "enterprise": {
                "stripe_price_id": "price_enterprise",  # Replace with actual Stripe price ID
                "name": "Enterprise Plan",
                "price": 499,
                "api_calls": 5000,
            },
        }

    async def create_customer(self, email: str, name: str) -> Dict:
        """Create a new customer in Stripe."""
        try:
            customer = stripe.Customer.create(email=email, name=name)
            return {
                "customer_id": customer.id,
                "email": customer.email,
                "name": customer.name,
            }
        except stripe.error.InvalidRequestError as e:
            raise PaymentValidationError(f"Invalid customer creation request: {str(e)}")
        except stripe.error.AuthenticationError as e:
            raise PaymentProcessingError(f"Authentication failed: {str(e)}")
        except stripe.error.APIConnectionError as e:
            raise PaymentProcessingError(f"API connection failed: {str(e)}")

    async def create_subscription(self, customer_id: str, price_id: str) -> Dict:
        """Create a new subscription."""
        try:
            subscription = stripe.Subscription.create(
                customer=customer_id,
                items=[{"price": price_id}],
                payment_behavior="default_incomplete",
                expand=["latest_invoice.payment_intent"],
            )
            return subscription.to_dict()
        except stripe.error.InvalidRequestError as e:
            raise PaymentValidationError(f"Invalid subscription request: {str(e)}")
        except stripe.error.AuthenticationError as e:
            raise PaymentProcessingError(f"Authentication failed: {str(e)}")
        except stripe.error.APIConnectionError as e:
            raise PaymentProcessingError(f"API connection failed: {str(e)}")

    async def cancel_subscription(self, subscription_id: str) -> Dict:
        """Cancel an existing subscription."""
        try:
            subscription = stripe.Subscription.delete(subscription_id)
            return subscription.to_dict()
        except stripe.error.InvalidRequestError as e:
            raise PaymentValidationError(f"Invalid cancellation request: {str(e)}")
        except stripe.error.AuthenticationError as e:
            raise PaymentProcessingError(f"Authentication failed: {str(e)}")
        except stripe.error.APIConnectionError as e:
            raise PaymentProcessingError(f"API connection failed: {str(e)}")

    async def update_subscription(self, subscription_id: str, price_id: str) -> Dict:
        """Update an existing subscription."""
        try:
            subscription = stripe.Subscription.modify(
                subscription_id,
                items=[{"price": price_id}],
                proration_behavior="always_invoice",
            )
            return subscription.to_dict()
        except stripe.error.InvalidRequestError as e:
            raise PaymentValidationError(f"Invalid update request: {str(e)}")
        except stripe.error.AuthenticationError as e:
            raise PaymentProcessingError(f"Authentication failed: {str(e)}")
        except stripe.error.APIConnectionError as e:
            raise PaymentProcessingError(f"API connection failed: {str(e)}")

    async def get_subscription_status(self, subscription_id: str) -> Dict:
        """Get the current status of a subscription."""
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            return {
                "subscription_id": subscription.id,
                "status": subscription.status,
                "current_period_end": datetime.fromtimestamp(
                    subscription.current_period_end
                ),
                "canceled_at": (
                    datetime.fromtimestamp(subscription.canceled_at)
                    if subscription.canceled_at
                    else None
                ),
            }
        except stripe.error.InvalidRequestError as e:
            raise PaymentValidationError(
                f"Invalid subscription status request: {str(e)}"
            )
        except stripe.error.AuthenticationError as e:
            raise PaymentProcessingError(f"Authentication failed: {str(e)}")
        except stripe.error.APIConnectionError as e:
            raise PaymentProcessingError(f"API connection failed: {str(e)}")

    async def create_portal_session(self, customer_id: str, return_url: str) -> str:
        """Create a billing portal session for the customer."""
        try:
            session = stripe.billing_portal.Session.create(
                customer=customer_id, return_url=return_url
            )
            return session.url
        except stripe.error.InvalidRequestError as e:
            raise PaymentValidationError(f"Invalid portal session request: {str(e)}")
        except stripe.error.AuthenticationError as e:
            raise PaymentProcessingError(f"Authentication failed: {str(e)}")
        except stripe.error.APIConnectionError as e:
            raise PaymentProcessingError(f"API connection failed: {str(e)}")

    async def handle_webhook(
        self, payload: Dict, signature: str, webhook_secret: str
    ) -> Dict:
        """Handle Stripe webhook events."""
        try:
            event = stripe.Webhook.construct_event(
                payload=payload, sig_header=signature, secret=webhook_secret
            )

            event_type = event.type
            event_data = event.data.object
            current_time = datetime.now(timezone.utc).isoformat()

            # Common response structure
            base_response = {
                "status": "success",
                "event": event_type,
                "timestamp": current_time,
            }

            # Handle subscription events
            if event_type in [
                "customer.subscription.created",
                "customer.subscription.updated",
                "customer.subscription.deleted",
            ]:
                return {
                    **base_response,
                    "subscription_id": event_data.id,
                    "customer_id": event_data.customer,
                }

            # Handle invoice events
            if event_type in ["invoice.payment_succeeded", "invoice.payment_failed"]:
                return {
                    **base_response,
                    "status": (
                        "failed"
                        if event_type == "invoice.payment_failed"
                        else "success"
                    ),
                    "invoice_id": event_data.id,
                    "customer_id": event_data.customer,
                }

            return {**base_response, "status": "ignored"}

        except stripe.error.SignatureVerificationError as e:
            raise PaymentValidationError(f"Invalid webhook signature: {str(e)}")
        except stripe.error.InvalidRequestError as e:
            raise PaymentValidationError(f"Invalid webhook payload: {str(e)}")
        except Exception as e:
            raise PaymentProcessingError(f"Webhook processing failed: {str(e)}")


# Initialize the payment service
payment_service = PaymentService("your_stripe_api_key")  # Replace with actual API key
