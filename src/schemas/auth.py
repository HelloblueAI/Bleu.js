"""Authentication schemas."""

from typing import Optional

from pydantic import BaseModel


class TokenData(BaseModel):
    """Token data schema."""

    username: Optional[str] = None
    scopes: list[str] = []
