import pytest
from fastapi import HTTPException

from src.models.subscription import APIToken, APITokenCreate
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
async def test_create_token(db_session, test_user, test_subscription):
    service = APITokenService(db_session)
    token = await service.create_token(
        _to_user_response(test_user), APITokenCreate(name="Test Token")
    )

    assert token.user_id == test_user.id
    assert token.name == "Test Token"
    assert token.is_active == "active"
    assert token.token.startswith("bleujs_")
    assert token.token_prefix.startswith("...")


@pytest.mark.asyncio
async def test_create_token_without_subscription(db_session, test_user):
    service = APITokenService(db_session)
    with pytest.raises(HTTPException) as exc_info:
        await service.create_token(
            _to_user_response(test_user), APITokenCreate(name="T")
        )

    assert exc_info.value.status_code == 403
    assert "active subscription" in str(exc_info.value.detail).lower()


@pytest.mark.asyncio
async def test_get_user_tokens(db_session, test_user, test_subscription):
    service = APITokenService(db_session)
    await service.create_token(
        _to_user_response(test_user), APITokenCreate(name="Test 1")
    )
    tokens = await service.get_user_tokens(_to_user_response(test_user))

    assert len(tokens) == 1
    assert tokens[0].name == "Test 1"


@pytest.mark.asyncio
async def test_revoke_token(db_session, test_user, test_subscription):
    service = APITokenService(db_session)
    created = await service.create_token(
        _to_user_response(test_user), APITokenCreate(name="Revoke Me")
    )
    revoked = await service.revoke_token(created.id, _to_user_response(test_user))

    assert revoked.id == created.id
    token = db_session.query(APIToken).filter(APIToken.id == created.id).first()
    assert token is not None
    assert token.is_active == "inactive"


@pytest.mark.asyncio
async def test_revoke_nonexistent_token(db_session, test_user):
    service = APITokenService(db_session)
    with pytest.raises(HTTPException) as exc_info:
        await service.revoke_token("nonexistent-id", _to_user_response(test_user))

    assert exc_info.value.status_code == 404
    assert "token not found" in str(exc_info.value.detail).lower()


@pytest.mark.asyncio
async def test_validate_token(db_session, test_user, test_subscription):
    service = APITokenService(db_session)
    created = await service.create_token(
        _to_user_response(test_user), APITokenCreate(name="Validate Me")
    )
    assert await service.validate_token(created.token) is True


@pytest.mark.asyncio
async def test_validate_inactive_token(db_session, test_user, test_subscription):
    service = APITokenService(db_session)
    created = await service.create_token(
        _to_user_response(test_user), APITokenCreate(name="Inactive")
    )
    await service.revoke_token(created.id, _to_user_response(test_user))

    assert await service.validate_token(created.token) is False


@pytest.mark.asyncio
async def test_rotate_token_invalidates_old_hash(
    db_session, test_user, test_subscription
):
    service = APITokenService(db_session)
    created = await service.create_token(
        _to_user_response(test_user), APITokenCreate(name="Rotate Me")
    )
    before = db_session.query(APIToken).filter(APIToken.id == created.id).first()
    old_hash = before.token_hash

    await service.rotate_token(created.id, _to_user_response(test_user))
    after = db_session.query(APIToken).filter(APIToken.id == created.id).first()

    assert after.token_hash != old_hash
    assert await service.validate_token(created.token) is False
