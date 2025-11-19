"""Application settings."""

import os
from typing import List

from pydantic import AnyUrl, EmailStr, Field, RedisDsn, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from src.config.rate_limiting_config import RateLimitingConfig
from src.config.redis_config import RedisConfig
from src.config.security_headers_config import SecurityHeadersConfig


class SQLiteURL(AnyUrl):
    """SQLite URL schema."""

    allowed_schemes = {"sqlite"}


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
        populate_by_name=True,
    )

    # Application settings
    APP_NAME: str = "Bleu.js"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = Field(default=False, alias="DEBUG")
    TESTING: bool = Field(default=False, alias="TESTING")
    ENV_NAME: str = Field(default="development", alias="ENV_NAME")
    LOG_LEVEL: str = Field(default="INFO", alias="LOG_LEVEL")

    # Security - Critical: Use environment variables only
    SECRET_KEY: str = Field(..., alias="SECRET_KEY")  # Must be provided
    ALGORITHM: str = Field(default="HS256", alias="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=30, alias="ACCESS_TOKEN_EXPIRE_MINUTES"
    )

    # Server settings
    PORT: int = Field(default=8000, alias="PORT")
    HOST: str = Field(default="localhost", alias="HOST")
    APP_ENV: str = Field(default="development", alias="APP_ENV")
    APP_DEBUG: bool = Field(default=False, alias="APP_DEBUG")
    APP_URL: str = Field(default="http://localhost:3000", alias="APP_URL")
    APP_PORT: int = Field(default=3000, alias="APP_PORT")
    VERSION: str = "0.1.0"
    API_VERSION: str = "v1"
    API_PREFIX: str = "/api"

    # Security: Allowed hosts for TrustedHostMiddleware
    ALLOWED_HOSTS: List[str] = Field(
        default=["localhost", "127.0.0.1", "::1"], alias="ALLOWED_HOSTS"
    )

    # Database settings
    DB_HOST: str = Field(default="localhost", alias="DB_HOST")
    DB_PORT: int = Field(default=5432, alias="DB_PORT")
    DB_NAME: str = Field(default="bleujs_dev", alias="DB_NAME")
    DB_USER: str = Field(default="bleujs_dev", alias="DB_USER")
    DB_PASSWORD: SecretStr = Field(..., alias="DB_PASSWORD")  # Must be provided
    DATABASE_URL: str = Field(default="sqlite:///./test.db", alias="DATABASE_URL")
    DATABASE_POOL_SIZE: int = Field(default=5, alias="DATABASE_POOL_SIZE")
    DATABASE_MAX_OVERFLOW: int = Field(default=10, alias="DATABASE_MAX_OVERFLOW")

    # Test Database settings
    TEST_DB_HOST: str = Field(default="localhost", alias="TEST_DB_HOST")
    TEST_DB_PORT: int = Field(default=5432, alias="TEST_DB_PORT")
    TEST_DB_NAME: str = Field(default="test_db", alias="TEST_DB_NAME")
    TEST_DB_USER: str = Field(default="test_user", alias="TEST_DB_USER")
    TEST_DB_PASSWORD: str = Field(
        default="test_db_password_123", alias="TEST_DB_PASSWORD"
    )

    # Redis settings
    REDIS_HOST: str = Field(default="localhost", alias="REDIS_HOST")
    REDIS_PORT: int = Field(default=6379, alias="REDIS_PORT")
    REDIS_DB: int = Field(default=0, alias="REDIS_DB")
    REDIS_PASSWORD: SecretStr | None = Field(default=None, alias="REDIS_PASSWORD")
    REDIS_URL: RedisDsn = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    REDIS_CONFIG: RedisConfig = RedisConfig()

    # Security settings
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000", alias="CORS_ORIGINS"
    )
    SECURITY_HEADERS: SecurityHeadersConfig = SecurityHeadersConfig()

    # JWT settings - All must be provided via environment
    JWT_SECRET_KEY: str = Field(..., alias="JWT_SECRET_KEY")
    JWT_ALGORITHM: str = Field(default="HS256", alias="JWT_ALGORITHM")
    JWT_SECRET: str = Field(..., alias="JWT_SECRET")
    JWT_EXPIRES_IN: str = Field(default="24h", alias="JWT_EXPIRES_IN")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=30, alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES"
    )
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = Field(
        default=7, alias="JWT_REFRESH_TOKEN_EXPIRE_DAYS"
    )

    # Encryption settings
    ENCRYPTION_KEY: str = Field(..., alias="ENCRYPTION_KEY")
    ENABLE_SECURITY: bool = Field(default=True, alias="ENABLE_SECURITY")

    @field_validator("SECRET_KEY", "JWT_SECRET_KEY", "JWT_SECRET", "ENCRYPTION_KEY")
    @classmethod
    def validate_secrets(cls, v: str) -> str:
        """Validate that secrets are properly set and secure."""
        if not v or v in [
            "test_jwt_secret_key",
            "dev_jwt_secret_key_123",
            "dev_encryption_key_123",
        ]:
            raise ValueError(
                "Security keys must be properly set via environment variables"
            )
        if len(v) < 32:
            raise ValueError("Security keys must be at least 32 characters long")
        return v

    @field_validator("ALLOWED_HOSTS", mode="before")
    @classmethod
    def parse_allowed_hosts(cls, v):
        """Parse ALLOWED_HOSTS from string or list."""
        if isinstance(v, str):
            return [host.strip() for host in v.split(",")]
        return v

    @property
    def cors_origins_list(self) -> list[str]:
        """Get CORS origins as a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def app_name(self) -> str:
        """Return the application display name."""
        return self.APP_NAME

    # Rate limiting settings
    RATE_LIMITING: RateLimitingConfig = RateLimitingConfig()
    RATE_LIMIT_WINDOW: int = Field(default=15, alias="RATE_LIMIT_WINDOW")
    RATE_LIMIT_MAX_REQUESTS: int = Field(default=100, alias="RATE_LIMIT_MAX_REQUESTS")
    RATE_LIMIT_CORE: int = Field(default=100, alias="RATE_LIMIT_CORE")
    RATE_LIMIT_ENTERPRISE: int = Field(default=1000, alias="RATE_LIMIT_ENTERPRISE")
    RATE_LIMIT_PERIOD: int = Field(default=3600, alias="RATE_LIMIT_PERIOD")
    TEST_RATE_LIMIT: int = Field(default=100, alias="TEST_RATE_LIMIT")
    TEST_RATE_LIMIT_WINDOW: int = Field(default=3600, alias="TEST_RATE_LIMIT_WINDOW")

    # Email settings
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True
    SMTP_USE_SSL: bool = False
    EMAILS_FROM_EMAIL: EmailStr | None = None
    EMAILS_FROM_NAME: str | None = None
    FROM_EMAIL: str = "noreply@bleujs.org"
    ALERT_EMAIL: str = "your-email@example.com"

    # OAuth settings
    GITHUB_CLIENT_ID: str = "your_github_client_id"
    GITHUB_CLIENT_SECRET: SecretStr = Field(default="your_github_client_secret")
    GOOGLE_CLIENT_ID: str = "your_google_client_id"
    GOOGLE_CLIENT_SECRET: SecretStr = Field(default="your_google_client_secret")

    # Monitoring settings
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 9090
    ENABLE_TRACING: bool = True
    JAEGER_HOST: str = "localhost"
    JAEGER_PORT: int = 6831
    SENTRY_DSN: str = "your_sentry_dsn"
    ENABLE_MONITORING: bool = True

    # Secrets management
    SECRETS_BACKEND: str = "local"
    VAULT_ADDR: str = "https://vault.example.com"
    VAULT_TOKEN: SecretStr = Field(default="test_token")
    VAULT_NAMESPACE: str = "test_namespace"
    LOCAL_SECRETS_PATH: str = os.path.join(os.getcwd(), "secrets")
    SECRET_ROTATION_INTERVAL: int = 3600

    # API settings
    API_KEY: SecretStr = Field(default="dev_api_key")
    API_SECRET: SecretStr = Field(default="dev_api_secret")
    TEST_API_KEY: str = "JeF8N9VobS6OlgTFiAuba99hRX47e70R9b5ivnBR"
    ENTERPRISE_TEST_API_KEY: str = "JeF8N9VobS6OlgTFiAuba99hRX47e70R9b5ivnBR"
    TEST_API_HOST: str = "localhost"
    TEST_API_PORT: int = 8000

    # Elasticsearch settings
    ELASTICSEARCH_HOST: str = "localhost"
    ELASTICSEARCH_PORT: int = 9200
    ELASTICSEARCH_USERNAME: str = "elastic"
    ELASTICSEARCH_PASSWORD: SecretStr = Field(default="changeme")
    ELASTICSEARCH_INDEX: str = "bleujs-dev"
    ELASTICSEARCH_SSL_VERIFY: bool = False

    # Model settings
    MODEL_PATH: str = "./models"
    MAX_SEQUENCE_LENGTH: int = 100
    VOCABULARY_SIZE: int = 10000
    EMBEDDING_DIM: int = 100
    NUM_LAYERS: int = 2
    HIDDEN_UNITS: int = 128
    DROPOUT_RATE: float = 0.2

    # Cache settings
    CACHE_TTL: int = 3600
    CACHE_ENABLED: bool = True
    CACHE_DRIVER: str = "redis"
    CACHE_PREFIX: str = "bleujs_test_"
    ENABLE_CACHE: bool = True

    # Quantum settings
    QUANTUM_ENABLED: bool = True
    QUANTUM_SIMULATOR_URL: str = "https://localhost:8080"
    ENABLE_QUANTUM: bool = True

    # AI settings
    ENABLE_AI: bool = True
    ENABLE_ML: bool = True

    # Logging settings
    ENABLE_LOGGING: bool = True
    LOG_CHANNEL: str = "stack"

    # Test user settings
    TEST_USER_EMAIL: str = "test@example.com"
    TEST_USER_PASSWORD: str = "test_password_123"

    # Node environment
    NODE_ENV: str = "development"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_url(cls, v: str | None, info) -> str:
        """Assemble database URL from components if not provided."""
        if isinstance(v, str):
            return v
        values = info.data
        user = values.get("DB_USER")
        password = values.get("DB_PASSWORD")
        if isinstance(password, SecretStr):
            password = password.get_secret_value()
        host = values.get("DB_HOST")
        port = values.get("DB_PORT")
        db = values.get("DB_NAME")
        return f"postgresql://{user}:{password}@{host}:{port}/{db}"


# Create settings instance
settings = Settings()
