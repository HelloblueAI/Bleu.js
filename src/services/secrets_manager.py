"""Secrets manager service module."""

import os
from typing import Any, Dict

from src.config import get_settings


class SecretsManager:
    """Service for managing secrets and sensitive configuration."""

    def __init__(self) -> None:
        """Initialize secrets manager."""
        self.settings = get_settings()

    def get_secret(self, key: str, default: Any = None) -> Any:
        """Get a secret value.

        Args:
            key: Secret key
            default: Default value if secret not found

        Returns:
            Any: Secret value or default
        """
        # First try environment variable
        value = os.getenv(key)
        if value is not None:
            return value

        # Then try settings
        try:
            return getattr(self.settings, key, default)
        except AttributeError:
            return default

    def get_database_url(self) -> str:
        """Get database URL from secrets.

        Returns:
            str: Database URL
        """
        return self.get_secret("DATABASE_URL", "sqlite:///./test.db")

    def get_redis_url(self) -> str:
        """Get Redis URL from secrets.

        Returns:
            str: Redis URL
        """
        redis_url = self.get_secret("REDIS_URL", "redis://localhost:6379")
        # Convert RedisDsn to string if needed
        return str(redis_url)

    def get_jwt_secret(self) -> str:
        """Get JWT secret from secrets.

        Returns:
            str: JWT secret
        """
        return self.get_secret("JWT_SECRET", "your-secret-key")

    def get_smtp_config(self) -> Dict[str, Any]:
        """Get SMTP configuration from secrets.

        Returns:
            Dict[str, Any]: SMTP configuration
        """
        smtp_use_tls = self.get_secret("SMTP_USE_TLS", "true")
        if isinstance(smtp_use_tls, bool):
            use_tls = smtp_use_tls
        else:
            use_tls = str(smtp_use_tls).lower() == "true"

        return {
            "host": self.get_secret("SMTP_HOST", "localhost"),
            "port": int(self.get_secret("SMTP_PORT", "587")),
            "username": self.get_secret("SMTP_USERNAME", ""),
            "password": self.get_secret("SMTP_PASSWORD", ""),
            "use_tls": use_tls,
        }

    def get_aws_config(self) -> Dict[str, Any]:
        """Get AWS configuration from secrets.

        Returns:
            Dict[str, Any]: AWS configuration
        """
        return {
            "access_key_id": self.get_secret("AWS_ACCESS_KEY_ID", ""),
            "secret_access_key": self.get_secret("AWS_SECRET_ACCESS_KEY", ""),
            "region": self.get_secret("AWS_REGION", "us-east-1"),
        }

    def is_production(self) -> bool:
        """Check if running in production.

        Returns:
            bool: True if production environment
        """
        return self.get_secret("ENVIRONMENT", "development").lower() == "production"


# Create singleton instance
secrets_manager = SecretsManager()
