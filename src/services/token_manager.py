"""Token manager service module."""

from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple

from fastapi import HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from src.config import settings
from src.models.user import User
from src.services.user_service import UserService


class TokenManager:
    """Service for managing authentication tokens."""

    def __init__(self, db: Session) -> None:
        """Initialize token manager.

        Args:
            db: Database session
        """
        self.db = db
        self.user_service = UserService(db)

    def create_access_token(
        self,
        data: Dict,
        expires_delta: Optional[timedelta] = None,
    ) -> str:
        """Create a new access token.

        Args:
            data: Data to encode in token
            expires_delta: Token expiry time

        Returns:
            str: Encoded JWT token
        """
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(
            to_encode,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM,
        )
        return encoded_jwt

    def create_refresh_token(
        self,
        data: Dict,
        expires_delta: Optional[timedelta] = None,
    ) -> str:
        """Create a new refresh token.

        Args:
            data: Data to encode in token
            expires_delta: Token expiry time

        Returns:
            str: Encoded JWT token
        """
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(days=7)
        to_encode.update({"exp": expire, "refresh": True})
        encoded_jwt = jwt.encode(
            to_encode,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM,
        )
        return encoded_jwt

    def decode_token(self, token: str) -> Dict:
        """Decode a JWT token.

        Args:
            token: JWT token to decode

        Returns:
            Dict: Decoded token data

        Raises:
            HTTPException: If token is invalid
        """
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM],
            )
            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

    def create_tokens(self, user: User) -> Tuple[str, str]:
        """Create access and refresh tokens for a user.

        Args:
            user: User to create tokens for

        Returns:
            Tuple[str, str]: Access token and refresh token
        """
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        access_token = self.create_access_token(
            data={"sub": str(user.id)},
            expires_delta=access_token_expires,
        )

        refresh_token = self.create_refresh_token(
            data={"sub": str(user.id)},
            expires_delta=refresh_token_expires,
        )

        return access_token, refresh_token

    def refresh_tokens(self, refresh_token: str) -> Tuple[str, str]:
        """Refresh access and refresh tokens.

        Args:
            refresh_token: Current refresh token

        Returns:
            Tuple[str, str]: New access token and refresh token

        Raises:
            HTTPException: If refresh token is invalid
        """
        try:
            payload = self.decode_token(refresh_token)
            if not payload.get("refresh"):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid refresh token",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid refresh token",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            user = self.user_service.get_user(int(user_id))
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            return self.create_tokens(user)

        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

    def verify_token(self, token: str) -> User:
        """Verify a token and return the associated user.

        Args:
            token: JWT token to verify

        Returns:
            User: User associated with token

        Raises:
            HTTPException: If token is invalid
        """
        payload = self.decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = self.user_service.get_user(int(user_id))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return user
