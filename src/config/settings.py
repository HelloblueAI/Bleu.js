"""Application settings."""

import os
from typing import List, Optional

from pydantic import AnyUrl, EmailStr, Field, RedisDsn, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from src.config.rate_limiting_config import RateLimitingConfig
from src.config.redis_config import RedisConfig
from src.config.secrets_manager_config import SecretsManagerConfig
from src.config.security_headers_config import SecurityHeadersConfig


class SQLiteURL(AnyUrl):
    """SQLite URL schema."""

    allowed_schemes = {"sqlite"}


class Settings(BaseSettings):
    """Application settings."""

    # Application settings
    APP_NAME: str = "Bleu.js"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    TESTING: bool = False
    ENV_NAME: str = "bleujs-prod"
    LOG_LEVEL: str = "INFO"
    SECRET_KEY: str = Field(default_factory=lambda: os.urandom(32).hex())
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    PORT: int = 8000
    HOST: str = "localhost"
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    APP_URL: str = (
        "https://localhost:3000"
        if os.getenv("ENVIRONMENT") == "production"
        else "http://localhost:3000"
    )
    APP_PORT: int = 3000
    VERSION: str = "0.1.0"
    API_VERSION: str = "v1"
    API_PREFIX: str = "/api"

    # Database settings
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "bleujs_dev"
    DB_USER: str = "bleujs_dev"
    DB_PASSWORD: SecretStr = Field(default="bleujs_dev_password")
    DATABASE_URL: str = Field(default="sqlite:///./test.db")
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10

    # Test Database settings
    TEST_DB_HOST: str = "localhost"
    TEST_DB_PORT: int = 5432
    TEST_DB_NAME: str = "test_db"
    TEST_DB_USER: str = "test_user"
    TEST_DB_PASSWORD: str = "test_db_password_123"

    # Redis settings
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[SecretStr] = None
    REDIS_URL: RedisDsn = Field(default="redis://localhost:6379/0")
    REDIS_CONFIG: RedisConfig = RedisConfig()

    # Security settings
    CORS_ORIGINS: str = (
        "https://localhost:3000"
        if os.getenv("ENVIRONMENT") == "production"
        else "http://localhost:3000"
    )
    SECURITY_HEADERS: SecurityHeadersConfig = SecurityHeadersConfig()
    JWT_SECRET_KEY: str = Field(default="test_jwt_secret_key")
    JWT_ALGORITHM: str = "HS256"
    JWT_SECRET: str = Field(default="dev_jwt_secret_key_123")
    JWT_EXPIRES_IN: str = "24h"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ENCRYPTION_KEY: str = Field(default="dev_encryption_key_123")
    ENABLE_SECURITY: bool = True

    @property
    def cors_origins_list(self) -> List[str]:
        """Get CORS origins as a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # Rate limiting settings
    RATE_LIMITING: RateLimitingConfig = RateLimitingConfig()
    RATE_LIMIT_WINDOW: int = 15
    RATE_LIMIT_MAX_REQUESTS: int = 100
    RATE_LIMIT_CORE: int = 100
    RATE_LIMIT_ENTERPRISE: int = 1000
    RATE_LIMIT_PERIOD: int = 3600
    TEST_RATE_LIMIT: int = 100
    TEST_RATE_LIMIT_WINDOW: int = 3600

    # AWS settings
    AWS_REGION: str = "us-east-1"
    AWS_PROFILE: str = "default"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[SecretStr] = None
    AWS_ACCOUNT_ID: str = "202533510486"
    AWS_S3_BUCKET: str = "bleujs-dev-assets"
    S3_BUCKET: str = "bleujs-assets"
    AWS_LAMBDA_FUNCTION: str = "bleujs-dev-lambda"
    SECURITY_GROUP_ID: str = "sg-0a1b2c3d4e5f6g7h8"
    CLOUDFRONT_DISTRIBUTION_ID: str = "your_cloudfront_distribution_id"
    AWS_SSO_START_URL: str = "https://bleujs.awsapps.com/start"
    AWS_SSO_REGION: str = "us-east-1"
    AWS_SSO_ACCOUNT_ID: str = "123456789012"
    AWS_SSO_ROLE_NAME: str = "Developer"
    AWS_API_CONFIG_BASE_URL: str = (
        "https://mozxitsnsh.execute-api.us-west-2.amazonaws.com/prod"
    )
    SECRETS_MANAGER: SecretsManagerConfig = SecretsManagerConfig()

    # Email settings
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[SecretStr] = None
    EMAILS_FROM_EMAIL: Optional[EmailStr] = None
    EMAILS_FROM_NAME: Optional[str] = None
    FROM_EMAIL: str = "noreply@bleujs.org"
    ALERT_EMAIL: str = "your-email@example.com"

    # Stripe settings
    STRIPE_API_KEY: Optional[SecretStr] = None
    STRIPE_WEBHOOK_SECRET: Optional[SecretStr] = None
    STRIPE_PUBLISHABLE_KEY: str = "pk_test_51R8JFN8512V8V5P...A6JQXkZSixh1N00Cwi7ggPP"
    STRIPE_SECRET_KEY: SecretStr = Field(default="sk_test_example")
    CORE_PLAN_ID: str = "prod_S2OOUMgSGerlwl"
    ENTERPRISE_PLAN_ID: str = "prod_S2OPRAPAJONst2"
    STRIPE_CORE_PRICE_ID: str = "price_core_test"
    STRIPE_ENTERPRISE_PRICE_ID: str = "price_enterprise_test"

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
    ALLOWED_HOSTS: str = "bleujs.com,www.bleujs.com"
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

    model_config = SettingsConfigDict(
        env_file=".env.test" if os.getenv("TESTING") == "true" else ".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        arbitrary_types_allowed=True,
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_url(cls, v: Optional[str], info) -> str:
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


settings = Settings()
