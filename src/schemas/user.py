"""User schemas module."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Base user schema."""

    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)


class UserCreate(UserBase):
    """Schema for creating a user."""

    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    """Schema for updating a user."""

    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    password: Optional[str] = Field(None, min_length=8)


class UserInDB(UserBase):
    """Schema for user in database."""

    id: int
    hashed_password: str
    stripe_customer_id: str
    email_verified: bool = False
    email_verified_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    password_changed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic configuration."""

        from_attributes = True


class User(UserBase):
    """Schema for user response."""

    id: int
    email_verified: bool = False
    email_verified_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic configuration."""

        from_attributes = True
