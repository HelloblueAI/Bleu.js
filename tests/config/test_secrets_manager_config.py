import os
import tempfile

import pytest

from src.config.secrets_manager_config import SecretsManagerConfig


@pytest.fixture
def temp_secrets_dir():
    """Create a temporary directory for secrets."""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    try:
        os.rmdir(temp_dir)
    except OSError:
        pass


@pytest.fixture
def env_vars(temp_secrets_dir):
    """Set up environment variables for testing."""
    os.environ["BACKEND"] = "vault"
    os.environ["VAULT_ADDR"] = "https://vault.example.com"
    os.environ["VAULT_TOKEN"] = "test_token"
    os.environ["VAULT_NAMESPACE"] = "test_namespace"
    os.environ["AWS_REGION"] = "us-west-2"
    os.environ["AWS_ACCESS_KEY_ID"] = "test_access_key"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "test_secret_key"
    os.environ["LOCAL_SECRETS_PATH"] = temp_secrets_dir
    os.environ["SECRET_ROTATION_INTERVAL"] = "3600"
    yield
    # Clean up environment variables
    for key in [
        "BACKEND",
        "VAULT_ADDR",
        "VAULT_TOKEN",
        "VAULT_NAMESPACE",
        "AWS_REGION",
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
        "LOCAL_SECRETS_PATH",
        "SECRET_ROTATION_INTERVAL",
    ]:
        os.environ.pop(key, None)


def test_default_values():
    """Test default configuration values."""
    assert SecretsManagerConfig.BACKEND == "local"
    assert SecretsManagerConfig.VAULT_ADDR is None
    assert SecretsManagerConfig.VAULT_TOKEN is None
    assert SecretsManagerConfig.VAULT_NAMESPACE is None
    assert SecretsManagerConfig.AWS_REGION is None
    assert SecretsManagerConfig.AWS_ACCESS_KEY_ID is None
    assert SecretsManagerConfig.AWS_SECRET_ACCESS_KEY is None
    assert SecretsManagerConfig.LOCAL_SECRETS_PATH == "./secrets"
    assert SecretsManagerConfig.SECRET_ROTATION_INTERVAL == 86400


def test_env_vars(env_vars, temp_secrets_dir):
    """Test environment variable configuration."""
    assert SecretsManagerConfig.BACKEND == "vault"
    assert SecretsManagerConfig.VAULT_ADDR == "https://vault.example.com"
    assert SecretsManagerConfig.VAULT_TOKEN == "test_token"
    assert SecretsManagerConfig.VAULT_NAMESPACE == "test_namespace"
    assert SecretsManagerConfig.AWS_REGION == "us-west-2"
    assert SecretsManagerConfig.AWS_ACCESS_KEY_ID == "test_access_key"
    assert SecretsManagerConfig.AWS_SECRET_ACCESS_KEY == "test_secret_key"
    assert SecretsManagerConfig.LOCAL_SECRETS_PATH == temp_secrets_dir
    assert SecretsManagerConfig.SECRET_ROTATION_INTERVAL == 3600


def test_invalid_backend():
    """Test invalid backend configuration."""
    with pytest.raises(ValueError):
        SecretsManagerConfig.BACKEND = "invalid"


def test_invalid_vault_addr():
    """Test invalid Vault address."""
    with pytest.raises(ValueError):
        SecretsManagerConfig.VAULT_ADDR = "invalid_url"


def test_invalid_aws_region():
    """Test invalid AWS region."""
    with pytest.raises(ValueError):
        SecretsManagerConfig.AWS_REGION = "invalid_region"


def test_invalid_local_secrets_path():
    """Test invalid local secrets path."""
    with pytest.raises(ValueError):
        SecretsManagerConfig.LOCAL_SECRETS_PATH = ""


def test_invalid_rotation_interval():
    """Test invalid rotation interval."""
    with pytest.raises(ValueError):
        SecretsManagerConfig.SECRET_ROTATION_INTERVAL = "invalid"


def test_vault_config(temp_secrets_dir):
    """Test Vault configuration settings."""
    os.environ["BACKEND"] = "vault"
    os.environ["VAULT_URL"] = "http://localhost:8200"
    os.environ["VAULT_TOKEN"] = "test_token"
    os.environ["LOCAL_SECRETS_PATH"] = temp_secrets_dir
    SecretsManagerConfig.reset()

    assert SecretsManagerConfig.BACKEND == "vault"
    config = SecretsManagerConfig.get_backend_config()
    assert config["url"] == "http://localhost:8200"
    assert config["token"] == "test_token"


def test_aws_config(temp_secrets_dir):
    """Test AWS configuration settings."""
    # Set environment variables
    os.environ["AWS_ACCESS_KEY_ID"] = "test_access_key"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "test_secret_key"
    os.environ["LOCAL_SECRETS_PATH"] = temp_secrets_dir
    os.environ["SECRET_ROTATION_INTERVAL"] = "3600"

    # Reset configuration to pick up new environment variables
    SecretsManagerConfig.reset()

    # Verify configuration
    assert SecretsManagerConfig.AWS_ACCESS_KEY_ID == "test_access_key"
    assert SecretsManagerConfig.AWS_SECRET_ACCESS_KEY == "test_secret_key"
    assert SecretsManagerConfig.LOCAL_SECRETS_PATH == temp_secrets_dir
    assert SecretsManagerConfig.SECRET_ROTATION_INTERVAL == 3600


def test_secrets_manager_config(temp_secrets_dir):
    """Test SecretsManagerConfig initialization and settings."""
    # Set environment variables
    os.environ["AWS_ACCESS_KEY_ID"] = "test_access_key"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "test_secret_key"
    os.environ["LOCAL_SECRETS_PATH"] = temp_secrets_dir
    os.environ["SECRET_ROTATION_INTERVAL"] = "3600"

    # Test initialization
    assert SecretsManagerConfig.AWS_ACCESS_KEY_ID == "test_access_key"
    assert SecretsManagerConfig.AWS_SECRET_ACCESS_KEY == "test_secret_key"
    assert SecretsManagerConfig.LOCAL_SECRETS_PATH == temp_secrets_dir
    assert SecretsManagerConfig.SECRET_ROTATION_INTERVAL == 3600

    # Test backend configuration
    assert SecretsManagerConfig.BACKEND == "local"
    assert SecretsManagerConfig.get_backend_config()["secrets_path"] == temp_secrets_dir

    # Reset
    SecretsManagerConfig.LOCAL_SECRETS_PATH = temp_secrets_dir


def test_backend_config(temp_secrets_dir: str) -> None:
    """Test backend configuration."""
    # Set up environment variables
    os.environ["SECRETS_BACKEND"] = "local"
    os.environ["LOCAL_SECRETS_PATH"] = temp_secrets_dir

    # Test configuration
    assert SecretsManagerConfig.BACKEND == "local"
    assert SecretsManagerConfig.get_backend_config()["secrets_path"] == temp_secrets_dir


def test_reset_config(temp_secrets_dir: str) -> None:
    """Test configuration reset."""
    SecretsManagerConfig.reset()

    assert SecretsManagerConfig.BACKEND == "local"
    assert SecretsManagerConfig.LOCAL_SECRETS_PATH == temp_secrets_dir
    assert SecretsManagerConfig.SECRET_ROTATION_INTERVAL == 3600


def test_update_backend(temp_secrets_dir: str) -> None:
    """Test updating backend configuration."""
    # Set up environment variables
    os.environ["LOCAL_SECRETS_PATH"] = temp_secrets_dir

    # Test updating to Vault
    SecretsManagerConfig.update_backend("vault")
    assert SecretsManagerConfig.BACKEND == "vault"
    assert (
        SecretsManagerConfig.get_backend_config()["url"] == "https://vault.example.com"
    )

    # Test updating to AWS
    SecretsManagerConfig.update_backend("aws")
    assert SecretsManagerConfig.BACKEND == "aws"
    assert SecretsManagerConfig.get_backend_config()["region_name"] == "us-west-2"


def test_update_rotation_interval(temp_secrets_dir: str) -> None:
    """Test updating rotation interval."""
    # Set up environment variables
    os.environ["LOCAL_SECRETS_PATH"] = temp_secrets_dir

    # Test valid interval
    SecretsManagerConfig.update_rotation_interval(7200)
    assert SecretsManagerConfig.SECRET_ROTATION_INTERVAL == 7200

    # Test invalid interval
    with pytest.raises(ValueError):
        SecretsManagerConfig.update_rotation_interval(-1)

    # Reset
    SecretsManagerConfig.update_rotation_interval(3600)


def test_update_local_path(temp_secrets_dir: str) -> None:
    """Test updating local path."""
    # Test valid path
    SecretsManagerConfig.update_local_path(temp_secrets_dir)
    assert SecretsManagerConfig.LOCAL_SECRETS_PATH == temp_secrets_dir

    # Test invalid path
    with pytest.raises(ValueError):
        SecretsManagerConfig.update_local_path("")


def test_update_vault_config():
    """Test updating Vault configuration."""
    SecretsManagerConfig.update_vault_config(
        "https://new-vault.example.com", "new_token", "new_namespace"
    )
    assert SecretsManagerConfig.VAULT_ADDR == "https://new-vault.example.com"
    assert SecretsManagerConfig.VAULT_TOKEN == "new_token"
    assert SecretsManagerConfig.VAULT_NAMESPACE == "new_namespace"

    # Reset
    SecretsManagerConfig.VAULT_ADDR = "https://vault.example.com"
    SecretsManagerConfig.VAULT_TOKEN = "test_token"
    SecretsManagerConfig.VAULT_NAMESPACE = "test_namespace"


def test_update_aws_config():
    """Test updating AWS configuration."""
    SecretsManagerConfig.update_aws_config(
        "us-east-1", "new_access_key", "new_secret_key"
    )
    assert SecretsManagerConfig.AWS_REGION == "us-east-1"
    assert SecretsManagerConfig.AWS_ACCESS_KEY_ID == "new_access_key"
    assert SecretsManagerConfig.AWS_SECRET_ACCESS_KEY == "new_secret_key"

    # Reset
    SecretsManagerConfig.AWS_REGION = "us-west-2"
    SecretsManagerConfig.AWS_ACCESS_KEY_ID = "test_access_key"
    SecretsManagerConfig.AWS_SECRET_ACCESS_KEY = "test_secret_key"


def test_update_local_config(temp_secrets_dir: str) -> None:
    """Test updating local configuration."""
    # Set up environment variables
    os.environ["LOCAL_SECRETS_PATH"] = temp_secrets_dir

    # Test updating to a new path
    new_temp_dir = tempfile.mkdtemp()
    try:
        SecretsManagerConfig.update_local_config(new_temp_dir)
        assert SecretsManagerConfig.LOCAL_SECRETS_PATH == new_temp_dir
    finally:
        try:
            os.rmdir(new_temp_dir)
        except OSError:
            pass

    # Reset to original temp directory
    SecretsManagerConfig.LOCAL_SECRETS_PATH = temp_secrets_dir


def test_default_config():
    """Test default configuration values."""
    assert SecretsManagerConfig.BACKEND == "local"
    assert SecretsManagerConfig.SECRET_ROTATION_INTERVAL == 3600


def test_local_config(temp_secrets_dir: str) -> None:
    """Test local configuration settings."""
    # Set environment variables
    os.environ["SECRETS_BACKEND"] = "local"
    os.environ["LOCAL_SECRETS_PATH"] = temp_secrets_dir
    SecretsManagerConfig.reset()

    # Test configuration
    assert SecretsManagerConfig.BACKEND == "local"
    assert SecretsManagerConfig.get_backend_config()["secrets_path"] == temp_secrets_dir


def test_invalid_backend_config(temp_secrets_dir):
    """Test invalid backend configuration."""
    os.environ["BACKEND"] = "invalid"
    os.environ["LOCAL_SECRETS_PATH"] = temp_secrets_dir
    SecretsManagerConfig.reset()

    with pytest.raises(ValueError, match="Invalid secrets backend"):
        SecretsManagerConfig.get_backend_config()


def test_secret_rotation_interval(temp_secrets_dir):
    """Test secret rotation interval configuration."""
    os.environ["SECRET_ROTATION_INTERVAL"] = "7200"
    os.environ["LOCAL_SECRETS_PATH"] = temp_secrets_dir
    SecretsManagerConfig.reset()

    assert SecretsManagerConfig.SECRET_ROTATION_INTERVAL == 7200
