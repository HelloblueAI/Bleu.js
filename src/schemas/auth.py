"""Authentication schemas."""

from typing import Optional

from pydantic import BaseModel


class TokenData(BaseModel):
    """Token data schema."""

    username: Optional[str] = None
    scopes: list[str] = []


class Token(BaseModel):
    """Token response schema (access_token, token_type)."""

    access_token: str
    token_type: str = "bearer"


class UserLogin(BaseModel):
    """User login request schema."""

    email: str
    password: str
