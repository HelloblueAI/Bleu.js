import logging
import smtplib
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from typing import Optional

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from src.config.settings import settings
from src.database import get_db
from src.models.subscription import Subscription, SubscriptionPlan
from src.models.user import User, UserCreate, UserResponse

logger = logging.getLogger(__name__)

# Security configuration from settings
SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_SECRET_KEY = settings.JWT_SECRET_KEY  # Using same secret key for refresh tokens

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


class AuthService:
    def __init__(self, db: Session):
        self.pwd_context = pwd_context
        self.oauth2_scheme = oauth2_scheme
        self.db = db

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self.pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        return self.pwd_context.hash(password)

    def create_access_token(
        self, data: dict, expires_delta: Optional[timedelta] = None
    ) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    def create_refresh_token(self, data: dict):
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(days=7)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    async def verify_refresh_token(self, token: str):
        try:
            payload = jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
            if datetime.now(timezone.utc) > datetime.fromtimestamp(
                payload["exp"], timezone.utc
            ):
                raise HTTPException(status_code=401, detail="Refresh token has expired")
            return payload
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

    async def get_current_user(self, token: str = None) -> UserResponse:
        """Get the current authenticated user."""
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            if not token:
                raise credentials_exception
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email: str = payload.get("sub")
            if email is None:
                raise credentials_exception
        except JWTError:
            raise credentials_exception

        user = self.db.query(User).filter(User.email == email).first()
        if user is None:
            raise credentials_exception

        return UserResponse.model_validate(user)

    async def create_user(self, user: UserCreate, db: Session) -> UserResponse:
        """Create a new user with subscription."""
        # Check if user exists
        db_user = db.query(User).filter(User.email == user.email).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Get the selected plan
        plan = (
            db.query(SubscriptionPlan)
            .filter(SubscriptionPlan.plan_type == user.plan_type)
            .first()
        )
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid plan type"
            )

        # Create user
        hashed_password = self.get_password_hash(user.password)
        trial_end_date = datetime.now(timezone.utc) + timedelta(days=plan.trial_days)

        db_user = User(
            email=user.email,
            hashed_password=hashed_password,
            full_name=user.full_name,
            trial_end_date=trial_end_date,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        # Create subscription
        subscription = Subscription(
            user_id=db_user.id,
            plan_id=plan.id,
            plan_type=user.plan_type,
            status="active",
            current_period_start=datetime.now(timezone.utc),
            current_period_end=trial_end_date,
        )
        db.add(subscription)
        db.commit()

        # Send verification email
        await self.send_verification_email(user.email)

        return UserResponse.model_validate(db_user)

    async def verify_email(self, token: str, db: Session) -> bool:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email: str = payload.get("sub")
            if email is None:
                return False

            user = db.query(User).filter(User.email == email).first()
            if user:
                user.is_verified = True
                db.commit()
                return True
            return False
        except JWTError:
            return False

    async def authenticate_user(
        self, email: str, password: str, db: Session
    ) -> Optional[User]:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return None
        if not self.verify_password(password, user.hashed_password):
            return None
        return user

    async def social_auth(self, provider: str, token: str, db: Session) -> UserResponse:
        if provider == "github":
            user_data = await self.get_github_user(token)
        elif provider == "google":
            user_data = await self.get_google_user(token)
        else:
            raise HTTPException(status_code=400, detail="Unsupported provider")

        # Check if user exists
        db_user = db.query(User).filter(User.email == user_data["email"]).first()
        if db_user:
            return UserResponse.from_orm(db_user)

        # Create new user
        db_user = User(
            email=user_data["email"],
            full_name=user_data["name"],
            plan="cor-e",  # Default to COR-E plan
            is_active=True,
            is_verified=True,  # Social auth users are pre-verified
            trial_end_date=datetime.now(timezone.utc) + timedelta(days=30),
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        return UserResponse.from_orm(db_user)

    async def get_github_user(self, token: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {token}"},
            )
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Invalid GitHub token")

            user_data = response.json()
            return {
                "email": user_data["email"],
                "name": user_data["name"] or user_data["login"],
            }

    async def get_google_user(self, token: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {token}"},
            )
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Invalid Google token")

            user_data = response.json()
            return {"email": user_data["email"], "name": user_data["name"]}

    async def send_verification_email(self, email: str):
        """Send email verification link to user."""
        try:
            # Create verification token
            token = self.create_access_token(
                data={"sub": email}, expires_delta=timedelta(hours=24)
            )

            # Create verification URL
            verification_url = f"{settings.BASE_URL}/verify-email?token={token}"

            # Email content
            subject = "Verify your Bleu.js account"
            body = f"""
            Welcome to Bleu.js!

            Please verify your email address by clicking the link below:
            {verification_url}

            This link will expire in 24 hours.

            If you did not create this account, please ignore this email.
            """

            # Send email using configured SMTP settings
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)

                msg = MIMEText(body)
                msg["Subject"] = subject
                msg["From"] = settings.SMTP_USER
                msg["To"] = email

                server.send_message(msg)

            logger.info(f"Verification email sent to {email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send verification email to {email}: {str(e)}")
            return False


# Create a singleton instance
auth_service = AuthService(get_db())
