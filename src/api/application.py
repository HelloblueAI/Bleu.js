import os
from datetime import datetime, timezone

import uvicorn
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Create FastAPI application
application = FastAPI(
    title="Bleu.js API",
    description="API for Bleu.js quantum computing services",
    version="1.1.4",
)

# CORS middleware configuration
application.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants
USER_ID_HEADER = "User ID"


class SubscriptionUpgrade(BaseModel):
    tier: str
    payment_token: str


@application.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc),
        "version": "1.0.0",
    }


@application.get("/subscriptions/me")
async def get_subscription(user_id: str = Header(..., alias=USER_ID_HEADER)):
    """Get current subscription details."""
    try:
        return {
            "status": "active",
            "tier": "basic",
            "expires_at": (
                datetime.now(timezone.utc).replace(
                    year=datetime.now(timezone.utc).year + 1
                )
            ).isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@application.get("/subscriptions/me/usage")
async def get_usage(user_id: str = Header(..., alias=USER_ID_HEADER)):
    """Get current subscription usage."""
    try:
        return {
            "requests": 100,
            "quota": 1000,
            "reset_at": (
                datetime.now(timezone.utc).replace(
                    day=1, hour=0, minute=0, second=0, microsecond=0
                )
            ).isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@application.post("/subscriptions/me/renew")
async def renew_subscription(user_id: str = Header(..., alias=USER_ID_HEADER)):
    """Renew an expired subscription."""
    try:
        return {
            "status": "renewed",
            "expires_at": (
                datetime.now(timezone.utc).replace(
                    year=datetime.now(timezone.utc).year + 1
                )
            ).isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@application.post("/subscriptions/me/upgrade")
async def upgrade_subscription(
    upgrade: SubscriptionUpgrade, user_id: str = Header(..., alias=USER_ID_HEADER)
):
    """Upgrade subscription to a higher tier."""
    try:
        return {
            "status": "upgraded",
            "tier": upgrade.tier,
            "expires_at": (
                datetime.now(timezone.utc).replace(
                    year=datetime.now(timezone.utc).year + 1
                )
            ).isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# For local development
if __name__ == "__main__":
    host = os.getenv("API_HOST", "127.0.0.1")  # Default to localhost
    port = int(os.getenv("API_PORT", "8000"))
    uvicorn.run(application, host=host, port=port)
