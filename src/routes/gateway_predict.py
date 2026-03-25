"""
Bleujs.org gateway contract: POST /predict (10 numeric features → prediction + confidence).

Lightweight and dependency-free (no numpy/xgboost) so Railway cold starts stay fast.
"""

from __future__ import annotations

import logging
import math

from fastapi import APIRouter
from pydantic import BaseModel, Field, field_validator

logger = logging.getLogger(__name__)

router = APIRouter(tags=["gateway"])


class PredictRequest(BaseModel):
    """Request body for bleujs.org BleuJSProvider."""

    features: list[float] = Field(
        ...,
        description="Exactly 10 numeric features from client-side text analysis.",
    )

    @field_validator("features")
    @classmethod
    def exactly_ten_finite(cls, v: list[float]) -> list[float]:
        if len(v) != 10:
            raise ValueError("features must contain exactly 10 numbers")
        out: list[float] = []
        for x in v:
            xf = float(x)
            if math.isnan(xf) or math.isinf(xf):
                raise ValueError("features must be finite numbers")
            out.append(xf)
        return out


def _predict_from_features(features: list[float]) -> tuple[int, float]:
    """Deterministic pseudo-label and confidence for template / routing on the client."""
    weighted = sum((i + 1) * f for i, f in enumerate(features))
    denom = 1.0 + sum(abs(f) for f in features)
    prediction = int(abs(weighted * 1_000_000)) % 2_147_483_647 % 8
    z = math.tanh(weighted / denom)
    confidence = min(0.99, max(0.05, 0.5 + 0.45 * abs(z)))
    return prediction, confidence


@router.post("/predict")
async def predict(body: PredictRequest) -> dict[str, float | int]:
    prediction, confidence = _predict_from_features(body.features)
    logger.debug("gateway /predict prediction=%s confidence=%s", prediction, confidence)
    return {"prediction": prediction, "confidence": confidence}
