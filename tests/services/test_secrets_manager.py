import os

import pytest

from src.services.secrets_manager import SecretsManager


@pytest.fixture
def secrets_manager():
    """Fixture to get secrets manager."""
    return SecretsManager(backend="local")


@pytest.fixture
def test_secret():
    """Fixture for test secret."""
    return {
        "name": "test_secret",
        "value": "test_value",
        "description": "Test secret",
        "tags": ["test", "local"],
    }


def test_local_backend(secrets_manager, test_secret):
    """Test local backend operations."""
    # Test create secret
    secret = secrets_manager.create_secret(
        test_secret["name"],
        test_secret["value"],
        test_secret["description"],
        test_secret["tags"],
    )
    assert secret["name"] == test_secret["name"]
    assert secret["description"] == test_secret["description"]
    assert secret["tags"] == test_secret["tags"]

    # Test get secret
    retrieved = secrets_manager.get_secret(test_secret["name"])
    assert retrieved["name"] == test_secret["name"]
    assert retrieved["value"] == test_secret["value"]

    # Test list secrets
    secrets = secrets_manager.list_secrets()
    assert len(secrets) > 0
    assert any(s["name"] == test_secret["name"] for s in secrets)

    # Test update secret
    updated = secrets_manager.update_secret(
        test_secret["name"], "new_value", "Updated description", ["updated", "test"]
    )
    assert updated["value"] == "new_value"
    assert updated["description"] == "Updated description"
    assert updated["tags"] == ["updated", "test"]

    # Test delete secret
    secrets_manager.delete_secret(test_secret["name"])
    assert secrets_manager.get_secret(test_secret["name"]) is None


def test_secret_rotation(secrets_manager, test_secret):
    """Test secret rotation."""
    # Create initial secret
    secrets_manager.create_secret(
        test_secret["name"],
        test_secret["value"],
        test_secret["description"],
        test_secret["tags"],
    )

    # Rotate secret
    rotated = secrets_manager.rotate_secret(test_secret["name"])
    assert rotated["value"] != test_secret["value"]

    # Verify old value is invalid
    assert secrets_manager.get_secret(test_secret["name"])["value"] == rotated["value"]

    # Cleanup
    secrets_manager.delete_secret(test_secret["name"])


def test_secret_not_found(secrets_manager):
    """Test handling of non-existent secrets."""
    with pytest.raises(ValueError):
        secrets_manager.get_secret("non_existent_secret")

    with pytest.raises(ValueError):
        secrets_manager.update_secret("non_existent_secret", "value")

    with pytest.raises(ValueError):
        secrets_manager.delete_secret("non_existent_secret")

    with pytest.raises(ValueError):
        secrets_manager.rotate_secret("non_existent_secret")


def test_invalid_backend():
    """Test invalid backend configuration."""
    with pytest.raises(ValueError):
        SecretsManager(backend="invalid_backend")


@pytest.mark.skipif(
    not os.getenv("VAULT_ADDR") or not os.getenv("VAULT_TOKEN"),
    reason="Vault environment variables not set",
)
def test_vault_backend():
    """Test Vault backend operations."""
    secrets_manager = SecretsManager(backend="vault")

    # Test create secret
    secret = secrets_manager.create_secret(
        "vault_test", "vault_value", "Vault test secret", ["vault", "test"]
    )
    assert secret["name"] == "vault_test"

    # Test get secret
    retrieved = secrets_manager.get_secret("vault_test")
    assert retrieved["value"] == "vault_value"

    # Cleanup
    secrets_manager.delete_secret("vault_test")


@pytest.mark.skipif(
    not os.getenv("AWS_ACCESS_KEY_ID") or not os.getenv("AWS_SECRET_ACCESS_KEY"),
    reason="AWS credentials not set",
)
def test_aws_backend():
    """Test AWS Secrets Manager backend operations."""
    secrets_manager = SecretsManager(backend="aws")

    # Test create secret
    secret = secrets_manager.create_secret(
        "aws_test", "aws_value", "AWS test secret", ["aws", "test"]
    )
    assert secret["name"] == "aws_test"

    # Test get secret
    retrieved = secrets_manager.get_secret("aws_test")
    assert retrieved["value"] == "aws_value"

    # Cleanup
    secrets_manager.delete_secret("aws_test")
