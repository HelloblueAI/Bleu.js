import logging
from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.subscription import PlanType
from src.models.user import Token, UserCreate, UserResponse
from src.services.auth_service import auth_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/signup", response_model=UserResponse)
async def signup(user: UserCreate, db: Session = Depends(get_db)):
    """Sign up a new user."""
    try:
        return await auth_service.create_user(user, db)
    except Exception as e:
        logger.error(f"Error in signup: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/signin", response_model=Token)
async def signin(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    """Sign in a user and return access token."""
    user = await auth_service.authenticate_user(
        form_data.username, form_data.password, db
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=auth_service.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_service.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/verify-email/{token}")
async def verify_email(token: str, db: Session = Depends(get_db)):
    """Verify user's email address."""
    success = await auth_service.verify_email(token, db)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )
    return {"message": "Email verified successfully"}


@router.post("/social-auth/{provider}", response_model=UserResponse)
async def social_auth(provider: str, token: str, db: Session = Depends(get_db)):
    """Authenticate user with social provider (GitHub or Google)."""
    try:
        return await auth_service.social_auth(provider, token, db)
    except Exception as e:
        logger.error(f"Error in social auth: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    current_user: UserResponse = Depends(auth_service.get_current_user),
):
    """Get current user's information."""
    return current_user
