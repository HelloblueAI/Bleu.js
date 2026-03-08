"""User service module."""

from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from src.models.user import User
from src.schemas.user import UserCreate, UserResponse


def _user_to_response(user: User) -> UserResponse:
    """Map User ORM model to UserResponse."""
    return UserResponse.model_validate(user.to_dict())


class UserService:
    """User service for managing user operations."""

    def __init__(self, db: Session | None = None):
        """Initialize user service.

        Args:
            db: Database session
        """
        self.db = db

    async def create_user(self, user: UserCreate) -> UserResponse:
        """Create a new user.

        Product registration uses AuthService.create_user (subscription + hashing).
        This method is for compatibility; prefer AuthService.create_user for signup.
        """
        raise NotImplementedError(
            "Use AuthService.create_user for registration (subscription + password hashing)."
        )

    def get_user(self, user_id: str) -> Optional[User]:
        """Get User ORM model by ID (for auth middleware and token manager).

        Args:
            user_id: User ID (UUID string)

        Returns:
            User or None
        """
        if not self.db:
            return None
        return self.db.query(User).filter(User.id == user_id).first()

    async def get_user_by_id(self, user_id: str) -> Optional[UserResponse]:
        """Get user by ID.

        Args:
            user_id: User ID

        Returns:
            User response or None
        """
        user = self.get_user(user_id)
        return _user_to_response(user) if user else None

    async def get_user_by_email(self, email: str) -> Optional[UserResponse]:
        """Get user by email.

        Args:
            email: User email

        Returns:
            User response or None
        """
        if not self.db:
            return None
        user = self.db.query(User).filter(User.email == email).first()
        return _user_to_response(user) if user else None

    async def update_user(
        self, user_id: str, user_data: Dict[str, Any]
    ) -> Optional[UserResponse]:
        """Update user by ID. Only updates allowed attributes (no raw password)."""
        if not self.db:
            return None
        user = self.get_user(user_id)
        if not user:
            return None
        allowed = {
            "email",
            "username",
            "full_name",
            "is_active",
            "bio",
            "location",
            "website",
            "twitter_handle",
            "github_username",
            "linkedin_url",
            "profile_picture",
        }
        for key, value in user_data.items():
            if key in allowed and hasattr(user, key):
                setattr(user, key, value)
        self.db.commit()
        self.db.refresh(user)
        return _user_to_response(user)

    async def delete_user(self, user_id: str) -> bool:
        """Delete user by ID. Returns True if deleted, False if not found."""
        if not self.db:
            return False
        user = self.get_user(user_id)
        if not user:
            return False
        self.db.delete(user)
        self.db.commit()
        return True

    async def list_users(self, skip: int = 0, limit: int = 100) -> List[UserResponse]:
        """List users with pagination."""
        if not self.db:
            return []
        users = self.db.query(User).offset(skip).limit(limit).all()
        return [_user_to_response(u) for u in users]
