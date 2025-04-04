"""
Services package for Bleu.js
"""

from sqlalchemy.orm import Session
from .api_token_service import APITokenService
from .auth_service import AuthService
from .email_service import EmailService
from .monitoring_service import MonitoringService
from .payment_service import PaymentService
from .rate_limiting_service import RateLimitingService
from .subscription_service import SubscriptionService

__all__ = [
    'APITokenService',
    'AuthService',
    'EmailService',
    'MonitoringService',
    'PaymentService',
    'RateLimitingService',
    'SubscriptionService',
    'init_services'
]


def init_services(db: Session):
    """
    Initialize all services with a database session.
    """
    from src.config import settings
    return {
        'api_token_service': APITokenService(db),
        'auth_service': AuthService(db),
        'email_service': EmailService(),
        'monitoring_service': MonitoringService(),
        'payment_service': PaymentService(settings.STRIPE_SECRET_KEY),
        'rate_limiting_service': RateLimitingService(db),
        'subscription_service': SubscriptionService(db)
    } 