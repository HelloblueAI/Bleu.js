from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.user import Token
from src.schemas.user import UserCreate, UserResponse
from src.services.auth_service import AuthService, get_current_user_dep

router = APIRouter()


@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    auth_service = AuthService(db)
    return await auth_service.create_user(user, db)


@router.post("/token", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    """Login and get access token."""
    auth_service = AuthService(db)
    user = await auth_service.authenticate_user(
        form_data.username, form_data.password, db
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = auth_service.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_current_user(current_user: UserResponse = Depends(get_current_user_dep)):
    """Get current user information."""
    return current_user


@router.post("/refresh")
async def refresh_token(token: str, db: Session = Depends(get_db)):
    """Refresh access token."""
    auth_service = AuthService(db)
    payload = await auth_service.verify_refresh_token(token)
    access_token = auth_service.create_access_token(data={"sub": payload["sub"]})
    return {"access_token": access_token, "token_type": "bearer"}
