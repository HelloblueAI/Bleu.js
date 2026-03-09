"""User model."""

import uuid
from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import Boolean, Column, DateTime, String, Text
from sqlalchemy.orm import relationship

from src.models.base import Base


class User(Base):
    """User model."""

    __tablename__ = "users"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(255), unique=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    api_key = Column(String(255), unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    profile_picture = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    website = Column(String(500), nullable=True)
    twitter_handle = Column(String(255), nullable=True)
    github_username = Column(String(255), nullable=True)
    linkedin_url = Column(String(500), nullable=True)

    # Relationships (fully qualified to avoid multiple-class registry errors)
    subscriptions = relationship(
        "src.models.subscription.Subscription", back_populates="user"
    )
    api_calls = relationship("src.models.api_call.APICall", back_populates="user")
    api_usage = relationship("src.models.api_call.APIUsage", back_populates="user")
    api_tokens = relationship("src.models.subscription.APIToken", back_populates="user")

    @property
    def subscription(self):
        """First active subscription, or first subscription if none active. Used by APIService."""
        subs = self.subscriptions or []
        active = [s for s in subs if getattr(s, "status", None) == "active"]
        return active[0] if active else (subs[0] if subs else None)

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', username='{self.username}')>"

    def to_dict(self):
        """Convert user to dictionary (internal; includes api_key)."""
        return {
            "id": str(self.id),
            "email": self.email,
            "username": self.username,
            "full_name": self.full_name,
            "is_active": self.is_active,
            "is_superuser": self.is_superuser,
            "is_admin": self.is_admin,
            "api_key": self.api_key,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "profile_picture": self.profile_picture,
            "bio": self.bio,
            "location": self.location,
            "website": self.website,
            "twitter_handle": self.twitter_handle,
            "github_username": self.github_username,
            "linkedin_url": self.linkedin_url,
        }

    def to_response_dict(self):
        """For API responses: never include raw api_key; only masked display."""
        return {
            "id": str(self.id),
            "email": self.email,
            "username": self.username,
            "full_name": self.full_name,
            "is_active": self.is_active,
            "is_superuser": self.is_superuser,
            "is_admin": self.is_admin,
            "api_key_display": (
                f"bleujs_****{self.api_key[-4:]}"
                if self.api_key and len(self.api_key) >= 4
                else None
            ),
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "last_login": self.last_login,
            "profile_picture": self.profile_picture,
            "bio": self.bio,
            "location": self.location,
            "website": self.website,
            "twitter_handle": self.twitter_handle,
            "github_username": self.github_username,
            "linkedin_url": self.linkedin_url,
        }


# Pydantic models for authentication only
class Token(BaseModel):
    """Token model for authentication."""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token data model."""

    email: str | None = None
