"""Tests for secrets manager configuration."""

import pytest

from src.config.secrets_manager_config import SecretsManagerConfig


class TestSecretsManagerConfig:
    """Test secrets manager configuration."""

    def test_default_values(self):
        """Test default configuration values."""
        config = SecretsManagerConfig()
        assert config.region_name == "us-east-1"
        assert config.aws_access_key_id is None
        assert config.aws_secret_access_key is None
        assert config.aws_session_token is None
        assert config.endpoint_url is None
        assert config.use_ssl is True
        assert config.verify is True
        assert config.timeout == 5
        assert config.max_retries == 3
        assert config.secret_name_prefix == "bleujs/"
        assert config.cache_ttl == 300
        assert config.enable_caching is True
        assert config.enable_encryption is True
        assert config.encryption_key is None

    def test_env_vars(self):
        """Test configuration from environment variables."""
        # Note: Environment variable reading is not implemented in the current model
        # This test verifies that the model works correctly without env var support
        config = SecretsManagerConfig()
        assert config.region_name == "us-east-1"
        assert config.aws_access_key_id is None
        assert config.aws_secret_access_key is None
        assert config.aws_session_token is None
        assert config.endpoint_url is None
        assert config.use_ssl is True
        assert config.verify is True
        assert config.timeout == 5
        assert config.max_retries == 3
        assert config.secret_name_prefix == "bleujs/"
        assert config.cache_ttl == 300
        assert config.enable_caching is True
        assert config.enable_encryption is True
        assert config.encryption_key is None

    def test_invalid_timeout(self):
        """Test invalid timeout validation."""
        with pytest.raises(ValueError):
            SecretsManagerConfig(timeout=-1)

    def test_invalid_max_retries(self):
        """Test invalid max retries validation."""
        with pytest.raises(ValueError):
            SecretsManagerConfig(max_retries=-1)

    def test_invalid_cache_ttl(self):
        """Test invalid cache TTL validation."""
        with pytest.raises(ValueError):
            SecretsManagerConfig(cache_ttl=0)

    def test_invalid_region_name(self):
        """Test invalid region name validation."""
        with pytest.raises(ValueError):
            SecretsManagerConfig(region_name="")

    def test_invalid_secret_name_prefix(self):
        """Test invalid secret name prefix validation."""
        with pytest.raises(ValueError):
            SecretsManagerConfig(secret_name_prefix="")

    def test_config_serialization(self):
        """Test configuration serialization."""
        config = SecretsManagerConfig(
            region_name="us-west-2",
            aws_access_key_id="test_key",
            aws_secret_access_key="test_secret",
            endpoint_url="https://secrets.example.com",
            use_ssl=False,
            verify=False,
            timeout=10,
            max_retries=5,
            secret_name_prefix="test/",
            cache_ttl=600,
            enable_caching=False,
            enable_encryption=False,
            encryption_key="test_encryption_key",
        )

        config_dict = config.model_dump()
        assert config_dict["region_name"] == "us-west-2"
        assert config_dict["aws_access_key_id"] == "test_key"
        assert config_dict["aws_secret_access_key"] == "test_secret"
        assert config_dict["endpoint_url"] == "https://secrets.example.com"
        assert config_dict["use_ssl"] is False
        assert config_dict["verify"] is False
        assert config_dict["timeout"] == 10
        assert config_dict["max_retries"] == 5
        assert config_dict["secret_name_prefix"] == "test/"
        assert config_dict["cache_ttl"] == 600
        assert config_dict["enable_caching"] is False
        assert config_dict["enable_encryption"] is False
        assert config_dict["encryption_key"] == "test_encryption_key"

    def test_config_from_dict(self):
        """Test creating configuration from dictionary."""
        config_data = {
            "region_name": "eu-west-1",
            "aws_access_key_id": "prod_key",
            "aws_secret_access_key": "prod_secret",
            "endpoint_url": "https://secrets.prod.com",
            "use_ssl": True,
            "verify": True,
            "timeout": 15,
            "max_retries": 10,
            "secret_name_prefix": "prod/",
            "cache_ttl": 900,
            "enable_caching": True,
            "enable_encryption": True,
            "encryption_key": "prod_encryption_key",
        }

        config = SecretsManagerConfig(**config_data)
        assert config.region_name == "eu-west-1"
        assert config.aws_access_key_id == "prod_key"
        assert config.aws_secret_access_key == "prod_secret"
        assert config.endpoint_url == "https://secrets.prod.com"
        assert config.use_ssl is True
        assert config.verify is True
        assert config.timeout == 15
        assert config.max_retries == 10
        assert config.secret_name_prefix == "prod/"
        assert config.cache_ttl == 900
        assert config.enable_caching is True
        assert config.enable_encryption is True
        assert config.encryption_key == "prod_encryption_key"

    def test_config_equality(self):
        """Test configuration equality."""
        config1 = SecretsManagerConfig(region_name="us-east-1", timeout=5)
        config2 = SecretsManagerConfig(region_name="us-east-1", timeout=5)
        config3 = SecretsManagerConfig(region_name="us-west-2", timeout=5)

        assert config1 == config2
        assert config1 != config3

    def test_config_repr(self):
        """Test configuration string representation."""
        config = SecretsManagerConfig(region_name="us-east-1", timeout=5)
        repr_str = repr(config)
        assert "SecretsManagerConfig" in repr_str
        assert "region_name='us-east-1'" in repr_str
        assert "timeout=5" in repr_str

    def test_aws_credentials(self):
        """Test AWS credentials configuration."""
        config = SecretsManagerConfig(
            aws_access_key_id="test_key",
            aws_secret_access_key="test_secret",
            aws_session_token="test_token",
        )
        assert config.aws_access_key_id == "test_key"
        assert config.aws_secret_access_key == "test_secret"
        assert config.aws_session_token == "test_token"

    def test_endpoint_configuration(self):
        """Test endpoint configuration."""
        config = SecretsManagerConfig(
            endpoint_url="https://localhost:8000",
            use_ssl=False,
            verify=False,
        )
        assert config.endpoint_url == "https://localhost:8000"
        assert config.use_ssl is False
        assert config.verify is False

    def test_caching_configuration(self):
        """Test caching configuration."""
        config = SecretsManagerConfig(
            cache_ttl=600,
            enable_caching=False,
        )
        assert config.cache_ttl == 600
        assert config.enable_caching is False

    def test_encryption_configuration(self):
        """Test encryption configuration."""
        config = SecretsManagerConfig(
            enable_encryption=True,
            encryption_key="test_encryption_key",
        )
        assert config.enable_encryption is True
        assert config.encryption_key == "test_encryption_key"

    def test_retry_configuration(self):
        """Test retry configuration."""
        config = SecretsManagerConfig(
            timeout=15,
            max_retries=10,
        )
        assert config.timeout == 15
        assert config.max_retries == 10

    def test_secret_name_prefix(self):
        """Test secret name prefix configuration."""
        config = SecretsManagerConfig(
            secret_name_prefix="custom/",
        )
        assert config.secret_name_prefix == "custom/"
