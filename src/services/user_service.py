"""User service module."""

import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from src.models.user import User
from src.schemas.user import UserCreate, UserUpdate
from src.services.stripe_service import StripeService

logger = logging.getLogger(__name__)


class UserService:
    """Service for managing users."""

    def __init__(self, db: Session, stripe_service: Optional[StripeService] = None):
        """Initialize the user service."""
        self.db = db
        self.stripe_service = stripe_service or StripeService()

    def get_user(self, user_id: int) -> Optional[User]:
        """Get a user by ID."""
        return self.db.query(User).filter(User.id == user_id).first()

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get a user by email."""
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get a user by username."""
        return self.db.query(User).filter(User.username == username).first()

    def get_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Get a list of users."""
        return self.db.query(User).offset(skip).limit(limit).all()

    def create_user(self, user_data: UserCreate) -> User:
        """Create a new user."""
        # Check if user already exists
        existing_user = (
            self.db.query(User)
            .filter(
                or_(User.email == user_data.email, User.username == user_data.username)
            )
            .first()
        )
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists")

        # Create Stripe customer
        stripe_customer = self.stripe_service.create_customer(
            email=user_data.email,
            name=user_data.username,
        )

        # Create user
        db_user = User(
            email=user_data.email,
            username=user_data.username,
            hashed_password=user_data.password,  # Password will be hashed by the model
            stripe_customer_id=stripe_customer["id"],
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def update_user(self, user_id: int, user_data: UserUpdate) -> Optional[User]:
        """Update a user."""
        user = self.get_user(user_id)
        if not user:
            return None

        # Update user fields
        for field, value in user_data.dict(exclude_unset=True).items():
            setattr(user, field, value)

        user.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete_user(self, user_id: int) -> bool:
        """Delete a user."""
        user = self.get_user(user_id)
        if not user:
            return False

        self.db.delete(user)
        self.db.commit()
        return True

    def verify_email(self, user_id: int) -> Optional[User]:
        """Verify a user's email."""
        user = self.get_user(user_id)
        if not user:
            return None

        user.email_verified = True
        user.email_verified_at = datetime.now(timezone.utc)
        user.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_last_login(self, user_id: int) -> Optional[User]:
        """Update a user's last login time."""
        user = self.get_user(user_id)
        if not user:
            return None

        user.last_login = datetime.now(timezone.utc)
        user.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_password(self, user_id: int, new_password: str) -> Optional[User]:
        """Update a user's password."""
        user = self.get_user(user_id)
        if not user:
            return None

        user.hashed_password = new_password  # Password will be hashed by the model
        user.password_changed_at = datetime.now(timezone.utc)
        user.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(user)
        return user

    def check_password_expiry(self, user_id: int) -> bool:
        """Check if a user's password has expired."""
        user = self.get_user(user_id)
        if not user or not user.password_changed_at:
            return False

        expiry_days = 90  # Password expires after 90 days
        expiry_date = user.password_changed_at + timedelta(days=expiry_days)
        return datetime.now(timezone.utc) > expiry_date
