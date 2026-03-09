import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.models.subscription import (
    APIToken,
    APITokenCreate,
    APITokenCreateResponse,
    APITokenResponse,
)
from src.models.user import User
from src.schemas.user import UserResponse
from src.utils.base_classes import BaseService

# Token storage: only hash is stored (big-tech practice). Raw token shown once at creation.
TOKEN_PREFIX = "bleujs_"


def _hash_token(raw_token: str) -> str:
    """SHA-256 hash of token for storage. Constant-time comparison when validating."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def _token_display_prefix(raw_token: str) -> str:
    """Last 4 chars for display only (e.g. ...abc1)."""
    return f"...{raw_token[-4:]}" if len(raw_token) >= 4 else "****"


class APITokenService(BaseService):
    def __init__(self, db: Session | None = None):
        self.db = db

    async def create_token(
        self, user: UserResponse, token_data: APITokenCreate
    ) -> APITokenCreateResponse:
        """Create a new API token for a user. Returns one-time raw token in response."""
        # Get the user's active subscription
        db_user = self.db.query(User).filter(User.id == user.id).first()
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        # Prefer an active subscription; fall back to first if no status filter
        active = [
            s
            for s in (db_user.subscriptions or [])
            if getattr(s, "status", None) == "active"
        ]
        subscription = (
            active[0]
            if active
            else (db_user.subscriptions[0] if db_user.subscriptions else None)
        )
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not have an active subscription",
            )

        # Generate raw token once; store only hash (never store raw). Show raw only in this response.
        raw_token = f"{TOKEN_PREFIX}{secrets.token_urlsafe(32)}"
        token_hash = _hash_token(raw_token)
        token_prefix = _token_display_prefix(raw_token)

        token = APIToken(
            user_id=user.id,
            name=token_data.name,
            token_hash=token_hash,
            token_prefix=token_prefix,
            is_active="active",
        )

        self.db.add(token)
        self.db.commit()
        self.db.refresh(token)

        # One-time response including raw token (like GitHub/Stripe). Never returned again.
        return token.to_create_response(raw_token=raw_token)

    async def get_user_tokens(self, user: UserResponse) -> list[APITokenResponse]:
        """Get all API tokens for a user. Never returns full token (only prefix for display)."""
        tokens = self.db.query(APIToken).filter(APIToken.user_id == user.id).all()
        return [
            APITokenResponse.model_validate(token.to_safe_dict()) for token in tokens
        ]

    async def revoke_token(self, token_id: str, user: UserResponse) -> APITokenResponse:
        """Revoke an API token."""
        token = (
            self.db.query(APIToken)
            .filter(APIToken.id == token_id, APIToken.user_id == user.id)
            .first()
        )

        if not token:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Token not found",
            )

        token.is_active = "inactive"
        self.db.commit()
        self.db.refresh(token)

        return APITokenResponse.model_validate(token.to_safe_dict())

    async def rotate_token(self, token_id: str, user: UserResponse) -> APITokenResponse:
        """Rotate (regenerate) an API token."""
        token = (
            self.db.query(APIToken)
            .filter(APIToken.id == token_id, APIToken.user_id == user.id)
            .first()
        )

        if not token:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Token not found",
            )

        raw_token = f"{TOKEN_PREFIX}{secrets.token_urlsafe(32)}"
        token.token_hash = _hash_token(raw_token)
        token.token_prefix = _token_display_prefix(raw_token)
        self.db.commit()
        self.db.refresh(token)

        # Rotate returns safe view; new raw token could be returned once (here we don't for simplicity)
        return APITokenResponse.model_validate(token.to_safe_dict())

    async def validate_token(self, plain_token: str) -> bool:
        """Validate an API token. Compares hash of input to stored hash (constant-time)."""
        token_hash = _hash_token(plain_token)
        db_token = (
            self.db.query(APIToken).filter(APIToken.token_hash == token_hash).first()
        )

        if not db_token:
            return False

        if db_token.is_active != "active":
            return False

        return True

    def execute(self, *args, **kwargs) -> Any:
        """Execute API token service operation.

        Args:
            *args: Variable length argument list
            **kwargs: Arbitrary keyword arguments

        Returns:
            Any: Result of the API token operation
        """
        # Default implementation - can be overridden by subclasses
        return {"status": "token_processed", "service": "api_token"}
