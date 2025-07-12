"""Services module."""

import logging
from typing import Dict

from fastapi import FastAPI
from sqlalchemy.orm import Session

from src.config import settings
from src.database import get_db
from src.services.api_service import APIService
from src.services.api_token_service import APITokenService
from src.services.auth_service import AuthService
from src.services.email_service import EmailService
from src.services.monitoring_service import MonitoringService
from src.services.payment_service import PaymentService
from src.services.rate_limiting_service import RateLimitingService
from src.services.subscription_service import SubscriptionService
from src.services.user_service import UserService

logger = logging.getLogger(__name__)

# Service instances that don't require database
email_service = EmailService()
monitoring_service = MonitoringService()
payment_service = PaymentService()


def init_services(app: FastAPI) -> None:
    """Initialize all services."""
    try:
        # Get database session
        db = next(get_db())

        # Initialize services that need database
        auth_service = AuthService(db)
        api_service = APIService(db)
        api_token_service = APITokenService(db)
        subscription_service = SubscriptionService(db)
        user_service = UserService(db)
        rate_limiting_service = RateLimitingService(None)  # Will be set up with Redis

        # Add services to app state
        app.state.auth_service = auth_service
        app.state.email_service = email_service
        app.state.monitoring_service = monitoring_service
        app.state.payment_service = payment_service
        app.state.rate_limiting_service = rate_limiting_service
        app.state.user_service = user_service
        app.state.api_service = api_service
        app.state.api_token_service = api_token_service
        app.state.subscription_service = subscription_service

        logger.info("All services initialized successfully")

    except Exception as e:
        logger.error(f"Error initializing services: {e}")
        raise


def get_service_dependencies() -> dict:
    """Get service dependencies for dependency injection."""
    return {
        "email_service": email_service,
        "monitoring_service": monitoring_service,
        "payment_service": payment_service,
    }


# Export services for easy access
__all__ = [
    "AuthService",
    "EmailService",
    "MonitoringService",
    "PaymentService",
    "RateLimitingService",
    "SubscriptionService",
    "UserService",
    "APIService",
    "APITokenService",
    "email_service",
    "monitoring_service",
    "payment_service",
    "init_services",
    "get_service_dependencies",
]
