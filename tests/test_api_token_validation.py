import pytest

from src.models.subscription import APITokenCreate
from src.schemas.user import UserResponse
from src.services.api_token_service import APITokenService


def _to_user_response(user) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        is_admin=user.is_admin,
        created_at=user.created_at,
        updated_at=user.updated_at,
        last_login=user.last_login,
        profile_picture=user.profile_picture,
        bio=user.bio,
        location=user.location,
        website=user.website,
        twitter_handle=user.twitter_handle,
        github_username=user.github_username,
        linkedin_url=user.linkedin_url,
    )


@pytest.mark.asyncio
async def test_validate_token_success(db_session, test_user, test_subscription):
    service = APITokenService(db_session)
    created = await service.create_token(
        _to_user_response(test_user), APITokenCreate(name="Validation Token")
    )

    assert await service.validate_token(created.token) is True


@pytest.mark.asyncio
async def test_validate_token_not_found(db_session):
    service = APITokenService(db_session)
    assert await service.validate_token("nonexistent-token") is False


@pytest.mark.asyncio
async def test_validate_token_after_revoke(db_session, test_user, test_subscription):
    service = APITokenService(db_session)
    created = await service.create_token(
        _to_user_response(test_user), APITokenCreate(name="Revoke Validation Token")
    )
    await service.revoke_token(created.id, _to_user_response(test_user))

    assert await service.validate_token(created.token) is False
