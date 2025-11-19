"""User schemas."""

from datetime import datetime

from pydantic import BaseModel, EmailStr
from pydantic._internal._model_construction import ModelMetaclass


class _CompatModelMetaclass(ModelMetaclass):
    """Metaclass providing backwards compatible __fields__ attribute access."""

    def __getattribute__(cls, item: str):
        if item == "__fields__":
            return cls.model_fields
        return super().__getattribute__(item)

    def __getattr__(cls, item: str):
        if item == "__fields__":
            return cls.model_fields
        return super().__getattr__(item)


class CompatBaseModel(BaseModel, metaclass=_CompatModelMetaclass):
    """Base model compatible with Pydantic v1 attribute access patterns."""


class UserBase(CompatBaseModel):
    """Base user schema."""

    email: EmailStr
    username: str | None = None
    full_name: str | None = None
    is_active: bool = True
    is_superuser: bool = False
    is_admin: bool = False


class UserCreate(UserBase):
    """User creation schema."""

    password: str


class UserUpdate(CompatBaseModel):
    """User update schema."""

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


class UserResponse(UserBase):
    """User response schema."""

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


class UserInDB(UserBase):
    """User in database schema."""

    id: str
    hashed_password: str
    api_key: str | None = None
    created_at: datetime
    updated_at: datetime
    last_login: datetime | None = None
