"""User model module."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from src.models.declarative_base import Base
from src.models.subscription import PlanType


class User(Base):
    """User model."""

    __tablename__ = "users"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)

    # Relationships
    api_tokens = relationship(
        "APIToken", back_populates="user", cascade="all, delete-orphan"
    )
    subscription = relationship(
        "Subscription", back_populates="user", cascade="all, delete-orphan"
    )
    api_calls = relationship(
        "APICall", back_populates="user", cascade="all, delete-orphan"
    )
    api_usage = relationship(
        "APIUsage", back_populates="user", cascade="all, delete-orphan"
    )
    rate_limits = relationship(
        "RateLimit", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        """Get string representation of user.

        Returns:
            str: String representation
        """
        return f"<User {self.username}>"

    def to_dict(self) -> dict:
        """Convert user to dictionary.

        Returns:
            dict: User data
        """
        return {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "full_name": self.full_name,
            "is_active": self.is_active,
            "is_superuser": self.is_superuser,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }

    @property
    def is_authenticated(self) -> bool:
        """Check if user is authenticated.

        Returns:
            bool: True if user is authenticated
        """
        return True

    @property
    def is_anonymous(self) -> bool:
        """Check if user is anonymous.

        Returns:
            bool: True if user is anonymous
        """
        return False

    def get_id(self) -> str:
        """Get user ID.

        Returns:
            str: User ID
        """
        return str(self.id)

    def update_last_login(self) -> None:
        """Update last login timestamp."""
        self.last_login = datetime.utcnow()

    def check_password(self, password: str) -> bool:
        """Check if password is correct.

        Args:
            password: Password to check

        Returns:
            bool: True if password is correct
        """
        from src.security.password import verify_password

        return verify_password(password, self.hashed_password)

    def set_password(self, password: str) -> None:
        """Set user password.

        Args:
            password: Password to set
        """
        from src.security.password import get_password_hash

        self.hashed_password = get_password_hash(password)

    def has_permission(self, permission: str) -> bool:
        """Check if user has permission.

        Args:
            permission: Permission to check

        Returns:
            bool: True if user has permission
        """
        # Superusers have all permissions
        if self.is_superuser:
            return True

        # TODO: Implement permission checking
        return False

    def has_subscription(self, subscription_type: str) -> bool:
        """Check if user has subscription.

        Args:
            subscription_type: Subscription type to check

        Returns:
            bool: True if user has subscription
        """
        return any(
            subscription.type == subscription_type and subscription.is_active
            for subscription in self.subscriptions
        )

    def get_active_api_token(self) -> Optional[str]:
        """Get active API token.

        Returns:
            Optional[str]: Active API token
        """
        active_token = next(
            (token for token in self.api_tokens if token.is_active),
            None,
        )
        return active_token.token if active_token else None


class UserBase(BaseModel):
    """Base user model."""

    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = None

    model_config = ConfigDict(arbitrary_types_allowed=True)


class UserCreate(UserBase):
    """User creation model."""

    password: str = Field(..., min_length=8)
    plan_type: PlanType

    model_config = ConfigDict(arbitrary_types_allowed=True)


class UserResponse(BaseModel):
    """User response model."""

    id: int
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)


class Token(BaseModel):
    """Token model."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: Optional[str] = None

    model_config = ConfigDict(arbitrary_types_allowed=True)


class TokenData(BaseModel):
    """Token data model."""

    sub: str
    exp: datetime
    refresh: bool = False

    model_config = ConfigDict(arbitrary_types_allowed=True)
