import logging
import os
import time
from datetime import datetime, timezone

import psutil
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel

from services.subscription_service import SubscriptionService
from src.config import get_settings
from src.middleware.error_handling import ErrorHandlingMiddleware

# Configure logging
logger = logging.getLogger(__name__)

# Get settings for configuration
settings = get_settings()

app = FastAPI(
    title="Bleu.js API",
    description="API for Bleu.js quantum computing services",
    version="1.1.8",
)

# Initialize services
subscription_service = SubscriptionService()

# Add comprehensive error handling middleware first
app.add_middleware(ErrorHandlingMiddleware)

# Security middleware - Trusted Host
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)

# CORS middleware configuration - Environment-based
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-API-Version"],
    max_age=3600,
)

# Constants
USER_ID_HEADER = "User ID"


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str


@app.get("/health")
async def health_check():
    """Enhanced health check endpoint with dependency monitoring and comprehensive metrics."""
    try:
        start_time = time.time()
        health_status = "healthy"
        checks = {}

        # System metrics
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage("/")

            checks["system"] = {
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "disk_percent": disk.percent,
                "memory_available_gb": round(memory.available / (1024**3), 2),
                "disk_free_gb": round(disk.free / (1024**3), 2),
            }

            # Check system health thresholds
            if cpu_percent > 90:
                health_status = "degraded"
                checks["system"]["warning"] = "High CPU usage"
            if memory.percent > 90:
                health_status = "degraded"
                checks["system"]["warning"] = "High memory usage"
            if disk.percent > 90:
                health_status = "degraded"
                checks["system"]["warning"] = "Low disk space"

        except Exception as e:
            health_status = "unhealthy"
            checks["system"] = {"error": f"System metrics unavailable: {str(e)}"}

        # Application metrics
        try:
            process = psutil.Process(os.getpid())
            memory_info = process.memory_info()

            checks["application"] = {
                "memory_used_mb": round(memory_info.rss / (1024**2), 2),
                "threads": process.num_threads(),
                "connections": len(process.connections()),
                "cpu_percent": process.cpu_percent(),
                "create_time": datetime.fromtimestamp(
                    process.create_time()
                ).isoformat(),
            }

        except Exception as e:
            health_status = "unhealthy"
            checks["application"] = {
                "error": f"Application metrics unavailable: {str(e)}"
            }

        # Database connectivity check
        try:
            from src.database import check_db_connection, get_db_stats

            db_healthy = check_db_connection()
            if db_healthy:
                db_stats = get_db_stats()
                checks["database"] = {
                    "status": "healthy",
                    "connection": "active",
                    "stats": db_stats,
                }
            else:
                health_status = "unhealthy"
                checks["database"] = {
                    "status": "unhealthy",
                    "connection": "failed",
                    "error": "Database connection check failed",
                }

        except Exception as e:
            health_status = "unhealthy"
            checks["database"] = {
                "status": "unhealthy",
                "error": f"Database check failed: {str(e)}",
            }

        # Redis connectivity check
        try:
            from src.config import get_settings

            settings = get_settings()

            import redis

            redis_client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                password=(
                    settings.REDIS_PASSWORD.get_secret_value()
                    if settings.REDIS_PASSWORD
                    else None
                ),
                socket_connect_timeout=5,
                socket_timeout=5,
            )

            redis_ping = redis_client.ping()
            if redis_ping:
                checks["redis"] = {
                    "status": "healthy",
                    "connection": "active",
                    "host": settings.REDIS_HOST,
                    "port": settings.REDIS_PORT,
                }
            else:
                health_status = "degraded"
                checks["redis"] = {
                    "status": "degraded",
                    "connection": "unresponsive",
                }

        except Exception as e:
            health_status = "degraded"
            checks["redis"] = {
                "status": "unhealthy",
                "error": f"Redis check failed: {str(e)}",
            }

        # External service dependencies
        try:
            import aiohttp

            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)):
                # Check if we can reach external services (example)
                external_checks = {}

                # Add your external service checks here
                # Example: API endpoints, third-party services, etc.

                checks["external_services"] = external_checks

        except Exception as e:
            checks["external_services"] = {
                "status": "unavailable",
                "error": f"External service checks failed: {str(e)}",
            }

        # Environment information
        checks["environment"] = {
            "python_version": os.getenv("PYTHON_VERSION", "unknown"),
            "environment": os.getenv("ENVIRONMENT", "development"),
            "app_version": "1.1.8",
            "uptime_seconds": int(time.time() - start_time),
        }

        response_time = time.time() - start_time

        return {
            "status": health_status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "response_time_ms": round(response_time * 1000, 2),
            "checks": checks,
            "summary": {
                "total_checks": len(checks),
                "healthy_checks": sum(
                    1 for check in checks.values() if check.get("status") == "healthy"
                ),
                "degraded_checks": sum(
                    1 for check in checks.values() if check.get("status") == "degraded"
                ),
                "unhealthy_checks": sum(
                    1 for check in checks.values() if check.get("status") == "unhealthy"
                ),
            },
        }

    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail=f"Health check failed: {str(e)}")


class SubscriptionPlan(BaseModel):
    id: str
    name: str
    price: float
    features: list[str]
    status: str
    expires_at: str


@app.get("/v1/subscriptions/plans", response_model=list[SubscriptionPlan])
async def list_subscription_plans():
    """List available subscription plans."""
    try:
        plans = await subscription_service.get_subscription_plans()
        return [
            {
                "id": plan["id"],
                "name": plan["name"],
                "price": plan["price"],
                "features": plan["features"],
                "status": plan["status"],
                "expires_at": plan["expires_at"].isoformat(),
            }
            for plan in plans
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class SubscriptionUsage(BaseModel):
    requests: int
    quota: int
    reset_at: str


@app.get("/v1/subscriptions/usage", response_model=SubscriptionUsage)
async def get_subscription_usage(user_id: str = Header(..., alias=USER_ID_HEADER)):
    """Get current subscription usage."""
    try:
        usage = await subscription_service.get_subscription_usage(user_id)
        return {
            "requests": usage["requests"],
            "quota": usage["quota"],
            "reset_at": usage["reset_at"].isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class SubscriptionUpgrade(BaseModel):
    tier: str
    expires_at: str


@app.post("/v1/subscriptions/upgrade", response_model=SubscriptionUpgrade)
async def upgrade_subscription(
    upgrade: SubscriptionUpgrade, user_id: str = Header(..., alias=USER_ID_HEADER)
):
    """Upgrade subscription plan."""
    try:
        result = await subscription_service.upgrade_subscription(user_id, upgrade.tier)
        return {"tier": result["tier"], "expires_at": result["expires_at"].isoformat()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v1/subscriptions/renew", response_model=SubscriptionUpgrade)
async def renew_subscription(user_id: str = Header(..., alias=USER_ID_HEADER)):
    """Renew subscription."""
    try:
        result = await subscription_service.renew_subscription(user_id)
        return {"tier": result["tier"], "expires_at": result["expires_at"].isoformat()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
