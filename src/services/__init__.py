"""Services package."""

from typing import Dict

from fastapi import FastAPI
from redis.asyncio import Redis
from sqlalchemy.orm import Session

from src.services.api_service import APIService
from src.services.api_token_service import APITokenService
from src.services.auth_service import AuthService
from src.services.email_service import EmailService
from src.services.monitoring_service import MonitoringService
from src.services.rate_limiting_service import RateLimitingService
from src.services.stripe_service import StripeService
from src.services.subscription_service import SubscriptionService
from src.services.user_service import UserService


def init_services(app: FastAPI, db: Session, redis: Redis) -> Dict[str, object]:
    """Initialize application services.

    Args:
        app: FastAPI application
        db: Database session
        redis: Redis client

    Returns:
        Dict[str, object]: Dictionary of initialized services
    """
    # Initialize services
    rate_limiting_service = RateLimitingService(redis)
    token_service = APITokenService(db)
    user_service = UserService(db)
    auth_service = AuthService(db)
    api_service = APIService(db)
    monitoring_service = MonitoringService()
    stripe_service = StripeService()
    subscription_service = SubscriptionService(db, stripe_service)
    email_service = EmailService()

    # Store services in app state
    app.state.rate_limiting_service = rate_limiting_service
    app.state.token_service = token_service
    app.state.user_service = user_service
    app.state.auth_service = auth_service
    app.state.api_service = api_service
    app.state.monitoring_service = monitoring_service
    app.state.stripe_service = stripe_service
    app.state.subscription_service = subscription_service
    app.state.email_service = email_service

    # Return services dictionary
    return {
        "rate_limiting_service": rate_limiting_service,
        "token_service": token_service,
        "user_service": user_service,
        "auth_service": auth_service,
        "api_service": api_service,
        "monitoring_service": monitoring_service,
        "stripe_service": stripe_service,
        "subscription_service": subscription_service,
        "email_service": email_service,
    }


__all__ = [
    "APIService",
    "APITokenService",
    "AuthService",
    "EmailService",
    "MonitoringService",
    "RateLimitingService",
    "StripeService",
    "SubscriptionService",
    "UserService",
    "init_services",
]
