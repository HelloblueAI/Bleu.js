from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.subscription import APITokenCreate, APITokenResponse
from src.models.user import UserResponse
from src.services.api_token_service import APITokenService
from src.services.auth_service import AuthService, oauth2_scheme

router = APIRouter()


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


def get_token_service(db: Session = Depends(get_db)) -> APITokenService:
    return APITokenService(db)


@router.post("/tokens", response_model=APITokenResponse)
async def create_token(
    token_data: APITokenCreate,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> APITokenResponse:
    """Create a new API token."""
    auth_service = AuthService(db)
    token_service = APITokenService(db)
    current_user = await auth_service.get_current_user(token)
    result = await token_service.create_token(current_user, token_data)
    db.commit()
    return result


@router.get("/tokens", response_model=List[APITokenResponse])
async def get_tokens(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> List[APITokenResponse]:
    """Get all API tokens for the current user."""
    auth_service = AuthService(db)
    token_service = APITokenService(db)
    current_user = await auth_service.get_current_user(token)
    return await token_service.get_user_tokens(current_user)


@router.post("/tokens/{token_id}/revoke", response_model=APITokenResponse)
async def revoke_token(
    token_id: str,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> APITokenResponse:
    """Revoke an API token."""
    auth_service = AuthService(db)
    token_service = APITokenService(db)
    current_user = await auth_service.get_current_user(token)
    result = await token_service.revoke_token(token_id, current_user)
    db.commit()
    return result


@router.post("/tokens/{token_id}/rotate", response_model=APITokenResponse)
async def rotate_token(
    token_id: str,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> APITokenResponse:
    """Rotate (regenerate) an API token."""
    auth_service = AuthService(db)
    token_service = APITokenService(db)
    current_user = await auth_service.get_current_user(token)
    result = await token_service.rotate_token(token_id, current_user)
    db.commit()
    return result
