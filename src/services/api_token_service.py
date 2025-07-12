import secrets
from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.models.subscription import APIToken, APITokenCreate, APITokenResponse
from src.models.user import User, UserResponse


class APITokenService:
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

        subscription = db_user.subscription
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not have an active subscription",
            )

        # Create new token
        token = APIToken(
            user_id=user.id,
            subscription_id=subscription.id,
            name=token_data.name,
            token=secrets.token_urlsafe(32),
            expires_at=token_data.expires_at
            or datetime.now(timezone.utc) + timedelta(days=30),
            is_active=True,
        )

        self.db.add(token)
        self.db.commit()
        self.db.refresh(token)

        return APITokenResponse.model_validate(token)

    async def get_user_tokens(self, user: UserResponse) -> List[APITokenResponse]:
        """Get all API tokens for a user."""
        tokens = self.db.query(APIToken).filter(APIToken.user_id == user.id).all()
        return [APITokenResponse.model_validate(token) for token in tokens]

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

        token.is_active = False
        self.db.commit()
        self.db.refresh(token)

        return APITokenResponse.model_validate(token)

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

        token.token = secrets.token_urlsafe(32)
        self.db.commit()
        self.db.refresh(token)

        return APITokenResponse.model_validate(token)

    async def validate_token(self, token: str) -> bool:
        """Validate an API token."""
        db_token = self.db.query(APIToken).filter(APIToken.token == token).first()

        if not db_token:
            return False

        if not db_token.is_active:
            return False

        if db_token.expires_at and db_token.expires_at.replace(
            tzinfo=timezone.utc
        ) < datetime.now(timezone.utc):
            return False

        return True
