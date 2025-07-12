"""Webhook routes."""

import json
import logging

from fastapi import APIRouter, HTTPException, Request, status

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/generic")
async def generic_webhook(request: Request):
    """Handle generic webhook events."""
    try:
        payload = await request.body()
        headers = dict(request.headers)

        # Log the webhook for debugging
        logger.info(f"Received webhook: {headers.get('content-type', 'unknown')}")
        logger.debug(f"Webhook payload: {payload}")

        # Parse JSON if possible
        try:
            data = json.loads(payload)
            logger.info(f"Webhook data: {data}")
        except json.JSONDecodeError:
            logger.warning("Webhook payload is not valid JSON")
            data = {"raw_payload": payload.decode()}

        # Here you can add logic to handle different webhook types
        # based on headers or payload structure

        return {
            "status": "received",
            "message": "Webhook processed successfully",
            "timestamp": "2024-01-01T00:00:00Z",
        }

    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process webhook",
        )


@router.get("/health")
async def webhook_health():
    """Health check for webhook endpoint."""
    return {
        "status": "healthy",
        "message": "Webhook endpoint is operational",
        "timestamp": "2024-01-01T00:00:00Z",
    }
