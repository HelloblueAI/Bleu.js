import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.models.subscription import APIToken, APITokenCreate, APITokenResponse
from src.models.user import User
from src.schemas.user import UserResponse
from src.utils.base_classes import BaseService


class APITokenService(BaseService):
    def __init__(self, db: Session):
        self.db = db

    async def create_token(
        self, user: UserResponse, token_data: APITokenCreate
    ) -> APITokenResponse:
        """Create a new API token for a user."""
        # Get the user's active subscription
        db_user = self.db.query(User).filter(User.id == user.id).first()
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        subscription = db_user.subscriptions[0] if db_user.subscriptions else None
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not have an active subscription",
            )

        # Create new token
        token = APIToken(
            user_id=user.id,
            name=token_data.name,
            token_hash=secrets.token_urlsafe(32),
            is_active="active",
        )

        self.db.add(token)
        self.db.commit()
        self.db.refresh(token)

        return APITokenResponse.model_validate(token.to_dict())

    async def get_user_tokens(self, user: UserResponse) -> list[APITokenResponse]:
        """Get all API tokens for a user."""
        tokens = self.db.query(APIToken).filter(APIToken.user_id == user.id).all()
        return [APITokenResponse.model_validate(token.to_dict()) for token in tokens]

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

        return APITokenResponse.model_validate(token.to_dict())

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

        token.token_hash = secrets.token_urlsafe(32)
        self.db.commit()
        self.db.refresh(token)

        return APITokenResponse.model_validate(token.to_dict())

    async def validate_token(self, token: str) -> bool:
        """Validate an API token."""
        db_token = self.db.query(APIToken).filter(APIToken.token_hash == token).first()

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
