"""Constants used throughout the application."""

# Error messages
NO_ACTIVE_SUBSCRIPTION = "No active subscription found"
SUBSCRIPTION_NOT_FOUND = "Subscription not found"
INVALID_TIER = "Invalid subscription tier"
INVALID_STATUS = "Invalid subscription status"
INVALID_AMOUNT = "Invalid usage amount"
INVALID_DATE = "Invalid date format"
QUOTA_EXCEEDED = "API call quota exceeded"
RATE_LIMIT_EXCEEDED = "Rate limit exceeded"

# Metrics
METRICS = {"CALLS": ":calls", "QUOTA": ":quota", "RESET": ":reset"}

APP_NAME = "Bleu.js"
APP_VERSION = "1.3.21"

__all__ = [
    "APP_NAME",
    "APP_VERSION",
    "NO_ACTIVE_SUBSCRIPTION",
    "SUBSCRIPTION_NOT_FOUND",
    "INVALID_TIER",
    "INVALID_STATUS",
    "INVALID_AMOUNT",
    "INVALID_DATE",
    "QUOTA_EXCEEDED",
    "RATE_LIMIT_EXCEEDED",
    "METRICS",
]
