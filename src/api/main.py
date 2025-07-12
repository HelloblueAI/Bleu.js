import os
from datetime import datetime

import psutil
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.subscription_service import SubscriptionService

app = FastAPI(
    title="Bleu.js API",
    description="API for Bleu.js quantum computing services",
    version="1.1.4",
)

# Initialize services
subscription_service = SubscriptionService()

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants
USER_ID_HEADER = "User ID"


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring and load balancer health checks."""
    try:
        # Get system metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage("/")

        # Get application metrics
        process = psutil.Process(os.getpid())
        memory_info = process.memory_info()

        return {
            "status": "healthy",
            "timestamp": datetime.now(datetime.timezone.utc).isoformat(),
            "system": {
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "disk_percent": disk.percent,
            },
            "application": {
                "memory_used": memory_info.rss,
                "threads": process.num_threads(),
                "connections": len(process.connections()),
            },
            "environment": {
                "python_version": os.getenv("PYTHON_VERSION", "unknown"),
                "environment": os.getenv("ENVIRONMENT", "development"),
            },
        }
    except Exception as e:
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
