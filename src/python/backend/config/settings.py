"""
Backend configuration settings.
"""

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

import torch
import yaml
from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


@dataclass
class DatabaseConfig:
    """Database configuration."""

    host: str
    port: int
    username: str
    password: str
    database: str
    pool_size: int = 5
    max_overflow: int = 10
    pool_timeout: int = 30
    pool_recycle: int = 1800


@dataclass
class APIConfig:
    """API configuration."""

    host: str
    port: int
    debug: bool
    workers: int
    cors_origins: List[str]
    rate_limit: int
    rate_limit_window: int
    jwt_secret: str
    jwt_algorithm: str
    jwt_expires_in: int


@dataclass
class CacheConfig:
    """Cache configuration."""

    host: str
    port: int
    password: Optional[str] = None
    db: int = 0
    ttl: int = 3600


@dataclass
class LoggingConfig:
    """Logging configuration."""

    level: str
    format: str
    file: Optional[str] = None
    max_size: int = 10485760  # 10MB
    backup_count: int = 5


@dataclass
class BackendConfig:
    """Main backend configuration."""

    environment: str
    debug: bool
    database: DatabaseConfig
    api: APIConfig
    cache: CacheConfig
    logging: LoggingConfig
    model_path: str
    batch_size: int
    max_sequence_length: int
    device: str
    num_workers: int
    timeout: int
    retry_attempts: int
    retry_delay: int


class DatabaseSettings(BaseSettings):
    """Database configuration settings."""

    host: str = Field(default="localhost", env="DB_HOST")
    port: int = Field(default=5432, env="DB_PORT")
    user: str = Field(default="postgres", env="DB_USER")
    password: str = Field(default="postgres", env="DB_PASSWORD")
    database: str = Field(default="bleujs", env="DB_NAME")
    pool_size: int = Field(default=5, env="DB_POOL_SIZE")
    max_overflow: int = Field(default=10, env="DB_MAX_OVERFLOW")
    pool_timeout: int = Field(default=30, env="DB_POOL_TIMEOUT")
    pool_recycle: int = Field(default=1800, env="DB_POOL_RECYCLE")


class APISettings(BaseSettings):
    """API configuration settings."""

    title: str = Field(default="Bleu.js API", env="API_TITLE")
    description: str = Field(
        default="API for Bleu.js machine learning platform",
        env="API_DESCRIPTION",
    )
    version: str = Field(default="1.0.0", env="API_VERSION")
    debug: bool = Field(default=False, env="API_DEBUG")
    docs_url: str = Field(default="/docs", env="API_DOCS_URL")
    redoc_url: str = Field(default="/redoc", env="API_REDOC_URL")
    openapi_url: str = Field(default="/openapi.json", env="API_OPENAPI_URL")
    jwt_secret: str = Field(default="your-secret-key", env="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(
        default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES"
    )


class RedisSettings(BaseSettings):
    """Redis configuration settings."""

    host: str = Field(default="localhost", env="REDIS_HOST")
    port: int = Field(default=6379, env="REDIS_PORT")
    db: int = Field(default=0, env="REDIS_DB")
    password: Optional[str] = Field(default=None, env="REDIS_PASSWORD")
    ssl: bool = Field(default=False, env="REDIS_SSL")
    ssl_cert_reqs: Optional[str] = Field(default=None, env="REDIS_SSL_CERT_REQS")


class CelerySettings(BaseSettings):
    """Celery configuration settings."""

    broker_url: str = Field(default="redis://localhost:6379/0", env="CELERY_BROKER_URL")
    result_backend: str = Field(
        default="redis://localhost:6379/0", env="CELERY_RESULT_BACKEND"
    )
    task_serializer: str = Field(default="json", env="CELERY_TASK_SERIALIZER")
    result_serializer: str = Field(default="json", env="CELERY_RESULT_SERIALIZER")
    accept_content: list = Field(default=["json"], env="CELERY_ACCEPT_CONTENT")
    task_ignore_result: bool = Field(default=False, env="CELERY_TASK_IGNORE_RESULT")
    task_time_limit: int = Field(default=3600, env="CELERY_TASK_TIME_LIMIT")
    task_soft_time_limit: int = Field(default=3000, env="CELERY_TASK_SOFT_TIME_LIMIT")
    worker_max_tasks_per_child: int = Field(
        default=1000, env="CELERY_WORKER_MAX_TASKS_PER_CHILD"
    )
    worker_prefetch_multiplier: int = Field(
        default=1, env="CELERY_WORKER_PREFETCH_MULTIPLIER"
    )


class Settings(BaseSettings):
    """Main application settings."""

    database: DatabaseSettings = DatabaseSettings()
    api: APISettings = APISettings()
    redis: RedisSettings = RedisSettings()
    celery: CelerySettings = CelerySettings()
    logging: LoggingConfig
    model_path: str
    batch_size: int
    max_sequence_length: int
    device: str
    num_workers: int
    timeout: int
    retry_attempts: int
    retry_delay: int
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "BleuJS"

    # Security
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Database
    MONGODB_URI: str = Field(..., env="MONGODB_URI")
    REDIS_HOST: str = Field(..., env="REDIS_HOST")
    REDIS_PORT: int = Field(6379, env="REDIS_PORT")

    # Sentry
    SENTRY_DSN: Optional[str] = Field(None, env="SENTRY_DSN")

    # Logging
    LOG_LEVEL: str = Field("INFO", env="LOG_LEVEL")

    def __init__(self, **data):
        super().__init__(**data)
        self.config: Optional[BackendConfig] = None
        self._load_env()
        self._load_config()

    def _load_env(self):
        """Load environment variables."""
        env_path = Path(__file__).parent.parent.parent.parent / ".env"
        if env_path.exists():
            load_dotenv(env_path)

    def _load_config(self):
        """Load configuration from YAML file."""
        config_path = Path(__file__).parent / "config.yaml"
        if not config_path.exists():
            self._create_default_config(config_path)

        with open(config_path, "r") as f:
            config_data = yaml.safe_load(f)

        self.config = self._parse_config(config_data)

    def _create_default_config(self, path: Path):
        """Create default configuration file."""
        default_config = {
            "environment": os.getenv("ENVIRONMENT", "development"),
            "debug": os.getenv("DEBUG", "False").lower() == "true",
            "database": {
                "host": os.getenv("DB_HOST", "localhost"),
                "port": int(os.getenv("DB_PORT", "5432")),
                "username": os.getenv("DB_USER", "postgres"),
                "password": os.getenv("DB_PASSWORD", ""),
                "database": os.getenv("DB_NAME", "quantum_db"),
                "pool_size": int(os.getenv("DB_POOL_SIZE", "5")),
                "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "10")),
                "pool_timeout": int(os.getenv("DB_POOL_TIMEOUT", "30")),
                "pool_recycle": int(os.getenv("DB_POOL_RECYCLE", "1800")),
            },
            "api": {
                "host": os.getenv("API_HOST", "127.0.0.1"),
                "port": int(os.getenv("API_PORT", "8000")),
                "debug": os.getenv("API_DEBUG", "False").lower() == "true",
                "workers": int(os.getenv("API_WORKERS", "4")),
                "cors_origins": os.getenv("CORS_ORIGINS", "*").split(","),
                "rate_limit": int(os.getenv("RATE_LIMIT", "100")),
                "rate_limit_window": int(os.getenv("RATE_LIMIT_WINDOW", "60")),
                "jwt_secret": os.getenv("JWT_SECRET", "your-secret-key"),
                "jwt_algorithm": os.getenv("JWT_ALGORITHM", "HS256"),
                "jwt_expires_in": int(os.getenv("JWT_EXPIRES_IN", "3600")),
            },
            "cache": {
                "host": os.getenv("CACHE_HOST", "localhost"),
                "port": int(os.getenv("CACHE_PORT", "6379")),
                "password": os.getenv("CACHE_PASSWORD", None),
                "db": int(os.getenv("CACHE_DB", "0")),
                "ttl": int(os.getenv("CACHE_TTL", "3600")),
            },
            "logging": {
                "level": os.getenv("LOG_LEVEL", "INFO"),
                "format": os.getenv(
                    "LOG_FORMAT", "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
                ),
                "file": os.getenv("LOG_FILE", None),
                "max_size": int(os.getenv("LOG_MAX_SIZE", "10485760")),
                "backup_count": int(os.getenv("LOG_BACKUP_COUNT", "5")),
            },
            "model_path": os.getenv("MODEL_PATH", "models"),
            "batch_size": int(os.getenv("BATCH_SIZE", "32")),
            "max_sequence_length": int(os.getenv("MAX_SEQUENCE_LENGTH", "512")),
            "device": os.getenv(
                "DEVICE", "cuda" if torch.cuda.is_available() else "cpu"
            ),
            "num_workers": int(os.getenv("NUM_WORKERS", "4")),
            "timeout": int(os.getenv("TIMEOUT", "30")),
            "retry_attempts": int(os.getenv("RETRY_ATTEMPTS", "3")),
            "retry_delay": int(os.getenv("RETRY_DELAY", "1")),
        }

        with open(path, "w") as f:
            yaml.dump(default_config, f, default_flow_style=False)

    def _parse_config(self, data: Dict[str, Any]) -> BackendConfig:
        """Parse configuration data into BackendConfig object."""
        return BackendConfig(
            environment=data["environment"],
            debug=data["debug"],
            database=DatabaseConfig(**data["database"]),
            api=APIConfig(**data["api"]),
            cache=CacheConfig(**data["cache"]),
            logging=LoggingConfig(**data["logging"]),
            model_path=data["model_path"],
            batch_size=data["batch_size"],
            max_sequence_length=data["max_sequence_length"],
            device=data["device"],
            num_workers=data["num_workers"],
            timeout=data["timeout"],
            retry_attempts=data["retry_attempts"],
            retry_delay=data["retry_delay"],
        )

    def get_config(self) -> BackendConfig:
        """Get the current configuration."""
        if self.config is None:
            raise RuntimeError("Configuration not loaded")
        return self.config

    def update_config(self, new_config: Dict[str, Any]):
        """Update configuration with new values."""
        config_path = Path(__file__).parent / "config.yaml"
        with open(config_path, "r") as f:
            current_config = yaml.safe_load(f)

        # Update with new values
        current_config.update(new_config)

        # Save updated config
        with open(config_path, "w") as f:
            yaml.dump(current_config, f, default_flow_style=False)

        # Reload configuration
        self._load_config()


# Create global settings instance
settings = Settings()
