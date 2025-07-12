"""User model."""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr
from sqlalchemy import Boolean, Column, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from src.models.base import Base


class User(Base):
    """User model."""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
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

    # Relationships
    subscriptions = relationship("Subscription", back_populates="user")
    api_calls = relationship("APICall", back_populates="user")
    payments = relationship("Payment", back_populates="user")
    api_tokens = relationship("APIToken", back_populates="user")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', username='{self.username}')>"

    def to_dict(self):
        """Convert user to dictionary."""
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


# Pydantic models for API
class Token(BaseModel):
    """Token model for authentication."""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token data model."""

    email: str | None = None


class UserBase(BaseModel):
    """Base user model."""

    email: EmailStr
    username: str | None = None
    full_name: str | None = None
    is_active: bool = True
    is_superuser: bool = False
    is_admin: bool = False

    class Config:
        from_attributes = True


class UserCreate(UserBase):
    """User creation model."""

    password: str


class UserUpdate(BaseModel):
    """User update model."""

    email: EmailStr | None = None
    username: str | None = None
    full_name: str | None = None
    password: str | None = None
    is_active: bool | None = None
    is_superuser: bool | None = None
    is_admin: bool | None = None
    profile_picture: str | None = None
    bio: str | None = None
    location: str | None = None
    website: str | None = None
    twitter_handle: str | None = None
    github_username: str | None = None
    linkedin_url: str | None = None

    class Config:
        from_attributes = True


class UserResponse(UserBase):
    """User response model."""

    id: str
    api_key: str | None = None
    created_at: datetime
    updated_at: datetime
    last_login: datetime | None = None
    profile_picture: str | None = None
    bio: str | None = None
    location: str | None = None
    website: str | None = None
    twitter_handle: str | None = None
    github_username: str | None = None
    linkedin_url: str | None = None

    class Config:
        from_attributes = True


class UserInDB(UserBase):
    """User in database model."""

    id: str
    hashed_password: str
    api_key: str | None = None
    created_at: datetime
    updated_at: datetime
    last_login: datetime | None = None

    class Config:
        from_attributes = True
