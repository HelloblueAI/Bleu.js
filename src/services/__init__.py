"""Services module."""

from src.services.api_service import APIService
from src.services.api_token_service import APITokenService
from src.services.auth_service import AuthService
from src.services.email_service import EmailService
from src.services.rate_limiting_service import RateLimitingService
from src.services.redis_client import RedisClient
from src.services.secrets_manager import SecretsManager
from src.services.subscription_service import SubscriptionService

# Only instantiate services that do not require a db or redis argument
api_service = APIService()
api_token_service = None  # Requires db
auth_service = None  # Requires db
email_service = EmailService()
rate_limiting_service = None  # Requires redis
redis_client = RedisClient()
secrets_manager = SecretsManager()
subscription_service = SubscriptionService()

# Service registry for dependency injection
service_registry = {
    "api_service": api_service,
    "api_token_service": api_token_service,
    "auth_service": auth_service,
    "email_service": email_service,
    "rate_limiting_service": rate_limiting_service,
    "redis_client": redis_client,
    "secrets_manager": secrets_manager,
    "subscription_service": subscription_service,
}


def init_services():
    """Initialize all services."""
    # This is a stub function for backward compatibility
    return service_registry


def get_service_dependencies():
    """Get service dependencies for dependency injection."""
    # This is a stub function for backward compatibility
    return service_registry


# Export all services
__all__ = [
    "APIService",
    "APITokenService",
    "AuthService",
    "EmailService",
    "RateLimitingService",
    "RedisClient",
    "SecretsManager",
    "SubscriptionService",
    "api_service",
    "api_token_service",
    "auth_service",
    "email_service",
    "rate_limiting_service",
    "redis_client",
    "secrets_manager",
    "subscription_service",
    "service_registry",
    "init_services",
    "get_service_dependencies",
]
