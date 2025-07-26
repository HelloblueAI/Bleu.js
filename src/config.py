"""Configuration module."""

import os
from typing import Any, Dict

from pydantic import BaseSettings

from src.config.settings import settings

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./bleu_js.db")

# Redis configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# JWT configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30")
)

# CORS configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

# Rate limiting configuration
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "60"))
RATE_LIMIT_MAX_REQUESTS = int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "100"))

# Email configuration
SMTP_HOST = os.getenv("SMTP_HOST", "localhost")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

# AWS configuration
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

# Application configuration
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# API configuration
API_V1_PREFIX = "/api/v1"
PROJECT_NAME = "Bleu.js API"
VERSION = "1.1.8"

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# Monitoring configuration
ENABLE_MONITORING = os.getenv("ENABLE_MONITORING", "true").lower() == "true"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Quantum configuration
QUANTUM_BACKEND = os.getenv("QUANTUM_BACKEND", "default")
QUANTUM_SHOTS = int(os.getenv("QUANTUM_SHOTS", "1000"))

# ML configuration
ML_MODEL_PATH = os.getenv("ML_MODEL_PATH", "./models")
ENABLE_GPU = os.getenv("ENABLE_GPU", "false").lower() == "true"

# Feature flags
ENABLE_QUANTUM_FEATURES = os.getenv("ENABLE_QUANTUM_FEATURES", "true").lower() == "true"
ENABLE_ML_FEATURES = os.getenv("ENABLE_ML_FEATURES", "true").lower() == "true"
ENABLE_MONITORING_FEATURES = (
    os.getenv("ENABLE_MONITORING_FEATURES", "true").lower() == "true"
)

# Configuration dictionary
config: Dict[str, Any] = {
    "database_url": DATABASE_URL,
    "redis_url": REDIS_URL,
    "jwt_secret_key": JWT_SECRET_KEY,
    "jwt_algorithm": JWT_ALGORITHM,
    "jwt_access_token_expire_minutes": JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
    "cors_origins": CORS_ORIGINS,
    "rate_limit_window": RATE_LIMIT_WINDOW,
    "rate_limit_max_requests": RATE_LIMIT_MAX_REQUESTS,
    "smtp_host": SMTP_HOST,
    "smtp_port": SMTP_PORT,
    "smtp_username": SMTP_USERNAME,
    "smtp_password": SMTP_PASSWORD,
    "smtp_use_tls": SMTP_USE_TLS,
    "aws_access_key_id": AWS_ACCESS_KEY_ID,
    "aws_secret_access_key": AWS_SECRET_ACCESS_KEY,
    "aws_region": AWS_REGION,
    "debug": DEBUG,
    "environment": ENVIRONMENT,
    "api_v1_prefix": API_V1_PREFIX,
    "project_name": PROJECT_NAME,
    "version": VERSION,
    "secret_key": SECRET_KEY,
    "algorithm": ALGORITHM,
    "enable_monitoring": ENABLE_MONITORING,
    "log_level": LOG_LEVEL,
    "quantum_backend": QUANTUM_BACKEND,
    "quantum_shots": QUANTUM_SHOTS,
    "ml_model_path": ML_MODEL_PATH,
    "enable_gpu": ENABLE_GPU,
    "enable_quantum_features": ENABLE_QUANTUM_FEATURES,
    "enable_ml_features": ENABLE_ML_FEATURES,
    "enable_monitoring_features": ENABLE_MONITORING_FEATURES,
}


def get_settings() -> BaseSettings:
    """Get application settings."""
    return settings


def get_config() -> Dict[str, Any]:
    """Get configuration dictionary."""
    return config
