import logging
from datetime import datetime
from typing import Dict

import stripe
from fastapi import APIRouter, HTTPException, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.customer import Customer, CustomerCreate
from ..services.email_service import email_service
from ..services.subscription_service import subscription_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events."""
    try:
        # Get the webhook secret from environment
        webhook_secret = request.app.state.settings.STRIPE_WEBHOOK_SECRET

        # Get the raw request body
        payload = await request.body()

        # Get the Stripe signature from headers
        sig_header = request.headers.get("stripe-signature")
        if not sig_header:
            raise HTTPException(status_code=400, detail="No Stripe signature found")

        try:
            # Verify the webhook signature
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        except stripe.error.SignatureVerificationError as e:
            raise HTTPException(status_code=400, detail=f"Invalid signature: {str(e)}")

        # Handle different event types
        event_type = event.type

        if event_type == "checkout.session.completed":
            await handle_checkout_completed(event.data.object)
        elif event_type == "customer.subscription.updated":
            await handle_subscription_updated(event.data.object)
        elif event_type == "customer.subscription.deleted":
            await handle_subscription_deleted(event.data.object)
        elif event_type == "invoice.payment_failed":
            await handle_payment_failed(event.data.object)

        return {"status": "success"}

    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def handle_checkout_completed(session: Dict):
    """Handle successful checkout completion."""
    try:
        customer_id = session.customer
        plan = session.metadata.get("plan")

        # Get customer details from Stripe
        customer = stripe.Customer.retrieve(customer_id)

        # Create customer in database
        db = next(get_db())
        customer_data = CustomerCreate(
            stripe_customer_id=customer_id,
            email=customer.email,
            plan=plan,
            features=subscription_service.plan_features[plan],
            api_calls_remaining=subscription_service.plan_features[plan][
                "api_calls_limit"
            ],
            rate_limit=subscription_service.plan_features[plan]["rate_limit"],
        )

        db_customer = Customer(**customer_data.dict())
        db.add(db_customer)
        db.commit()
        db.refresh(db_customer)

        # Send welcome email
        await email_service.send_welcome_email(
            email=customer.email,
            api_key=db_customer.api_key,
            plan=plan,
            documentation_url=subscription_service._get_documentation_url(plan),
        )

        logger.info(f"Successfully processed checkout for customer {customer_id}")

    except Exception as e:
        logger.error(f"Error handling checkout completion: {str(e)}")
        raise


async def handle_subscription_updated(subscription: Dict):
    """Handle subscription updates."""
    try:
        customer_id = subscription.customer
        plan = subscription.metadata.get("plan")

        # Update customer in database
        db = next(get_db())
        customer = (
            db.query(Customer)
            .filter(Customer.stripe_customer_id == customer_id)
            .first()
        )
        if customer:
            customer.plan = plan
            customer.features = subscription_service.plan_features[plan]
            customer.api_calls_remaining = subscription_service.plan_features[plan][
                "api_calls_limit"
            ]
            customer.rate_limit = subscription_service.plan_features[plan]["rate_limit"]
            customer.subscription_end = datetime.fromtimestamp(
                subscription.current_period_end
            )
            db.commit()

            logger.info(f"Successfully updated subscription for customer {customer_id}")

    except Exception as e:
        logger.error(f"Error handling subscription update: {str(e)}")
        raise


async def handle_subscription_deleted(subscription: Dict):
    """Handle subscription deletion."""
    try:
        customer_id = subscription.customer

        # Update customer in database
        db = next(get_db())
        customer = (
            db.query(Customer)
            .filter(Customer.stripe_customer_id == customer_id)
            .first()
        )
        if customer:
            customer.is_active = False
            customer.subscription_end = datetime.fromtimestamp(
                subscription.current_period_end
            )
            db.commit()

            logger.info(
                f"Successfully deactivated subscription for customer {customer_id}"
            )

    except Exception as e:
        logger.error(f"Error handling subscription deletion: {str(e)}")
        raise


async def handle_payment_failed(invoice: Dict):
    """Handle failed payments."""
    try:
        customer_id = invoice.customer

        # Get customer from database
        db = next(get_db())
        customer = (
            db.query(Customer)
            .filter(Customer.stripe_customer_id == customer_id)
            .first()
        )
        if customer:
            # Send payment failure notification
            await email_service.send_payment_failure_email(
                email=customer.email,
                amount=invoice.amount_due / 100,  # Convert from cents to dollars
                due_date=datetime.fromtimestamp(invoice.due_date),
            )

            logger.info(
                f"Successfully processed payment failure for customer {customer_id}"
            )

    except Exception as e:
        logger.error(f"Error handling payment failure: {str(e)}")
        raise
