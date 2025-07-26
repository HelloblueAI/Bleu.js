"""
Tests for services modules
"""

import asyncio
from datetime import datetime, timezone
from unittest.mock import AsyncMock, Mock, patch

import pytest

from src.services.api_service import APIService
from src.services.api_token_service import APITokenService
from src.services.auth_service import AuthService
from src.services.email_service import EmailService
from src.services.model_service import ModelService
from src.services.monitoring_service import MonitoringService
from src.services.rate_limiting_service import RateLimitingService
from src.services.redis_client import RedisClient
from src.services.secrets_manager import SecretsManager
from src.services.subscription_service import SubscriptionService
from src.services.token_manager import TokenManager
from src.services.user_service import UserService


class TestAPIService:
    """Test APIService class"""

    def test_api_service_initialization(self):
        """Test API service initialization"""
        service = APIService(
            base_url="https://api.example.com", api_key="test_key", timeout=30
        )

        assert service.base_url == "https://api.example.com"
        assert service.api_key == "test_key"
        assert service.timeout == 30

    @pytest.mark.asyncio
    async def test_make_request(self):
        """Test making API request"""
        service = APIService(base_url="https://api.example.com")

        with patch("httpx.AsyncClient.get") as mock_get:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"data": "test"}
            mock_get.return_value = mock_response

            result = await service.make_request("GET", "/test")
            assert result == {"data": "test"}
            mock_get.assert_called_once()

    @pytest.mark.asyncio
    async def test_handle_rate_limiting(self):
        """Test rate limiting handling"""
        service = APIService(base_url="https://api.example.com")

        with patch("asyncio.sleep") as mock_sleep:
            await service.handle_rate_limiting(429, {"retry_after": 5})
            mock_sleep.assert_called_once_with(5)


class TestAuthService:
    """Test AuthService class"""

    def test_auth_service_initialization(self):
        """Test auth service initialization"""
        service = AuthService(
            secret_key="test_secret", algorithm="HS256", access_token_expire_minutes=30
        )

        assert service.secret_key == "test_secret"
        assert service.algorithm == "HS256"
        assert service.access_token_expire_minutes == 30

    def test_create_access_token(self):
        """Test creating access token"""
        service = AuthService(secret_key="test_secret")

        token = service.create_access_token({"sub": "test_user"})
        assert isinstance(token, str)
        assert len(token) > 0

    def test_verify_token(self):
        """Test token verification"""
        service = AuthService(secret_key="test_secret")

        # Create a token
        token = service.create_access_token({"sub": "test_user"})

        # Verify the token
        payload = service.verify_token(token)
        assert payload["sub"] == "test_user"

    def test_hash_password(self):
        """Test password hashing"""
        service = AuthService(secret_key="test_secret")

        password = "test_password"
        hashed = service.hash_password(password)

        assert hashed != password
        assert service.verify_password(password, hashed)

    def test_verify_password(self):
        """Test password verification"""
        service = AuthService(secret_key="test_secret")

        password = "test_password"
        hashed = service.hash_password(password)

        assert service.verify_password(password, hashed) is True
        assert service.verify_password("wrong_password", hashed) is False


class TestEmailService:
    """Test EmailService class"""

    def test_email_service_initialization(self):
        """Test email service initialization"""
        service = EmailService(
            smtp_server="smtp.gmail.com",
            smtp_port=587,
            username="test@example.com",
            password="test_password",
        )

        assert service.smtp_server == "smtp.gmail.com"
        assert service.smtp_port == 587
        assert service.username == "test@example.com"

    @pytest.mark.asyncio
    async def test_send_email(self):
        """Test sending email"""
        service = EmailService(
            smtp_server="smtp.gmail.com",
            username="test@example.com",
            password="test_password",
        )

        with patch("smtplib.SMTP") as mock_smtp:
            mock_server = Mock()
            mock_smtp.return_value = mock_server

            await service.send_email(
                to_email="recipient@example.com",
                subject="Test Subject",
                body="Test Body",
            )

            mock_smtp.assert_called_once()
            mock_server.starttls.assert_called_once()
            mock_server.login.assert_called_once()
            mock_server.send_message.assert_called_once()

    def test_generate_email_template(self):
        """Test email template generation"""
        service = EmailService()

        template = service.generate_email_template(
            template_name="welcome", data={"user_name": "John"}
        )

        assert isinstance(template, str)
        assert "John" in template


class TestModelService:
    """Test ModelService class"""

    def test_model_service_initialization(self):
        """Test model service initialization"""
        service = ModelService(model_path="/path/to/models", cache_size=100)

        assert service.model_path == "/path/to/models"
        assert service.cache_size == 100

    def test_load_model(self):
        """Test model loading"""
        service = ModelService()

        with patch("pickle.load") as mock_load:
            mock_model = Mock()
            mock_load.return_value = mock_model

            model = service.load_model("test_model.pkl")
            assert model == mock_model
            mock_load.assert_called_once()

    def test_save_model(self):
        """Test model saving"""
        service = ModelService()

        mock_model = Mock()

        with patch("pickle.dump") as mock_dump:
            service.save_model(mock_model, "test_model.pkl")
            mock_dump.assert_called_once()

    def test_get_model_metadata(self):
        """Test getting model metadata"""
        service = ModelService()

        with patch("os.path.exists") as mock_exists:
            mock_exists.return_value = True
            with patch("json.load") as mock_load:
                mock_load.return_value = {"version": "1.0", "accuracy": 0.95}

                metadata = service.get_model_metadata("test_model")
                assert metadata["version"] == "1.0"
                assert metadata["accuracy"] == 0.95


class TestMonitoringService:
    """Test MonitoringService class"""

    def test_monitoring_service_initialization(self):
        """Test monitoring service initialization"""
        service = MonitoringService(
            metrics_endpoint="http://localhost:9090", log_level="INFO"
        )

        assert service.metrics_endpoint == "http://localhost:9090"
        assert service.log_level == "INFO"

    def test_record_metric(self):
        """Test recording metrics"""
        service = MonitoringService()

        with patch("prometheus_client.Counter.labels") as mock_counter:
            mock_counter.return_value.inc.return_value = None

            service.record_metric("api_requests", {"endpoint": "/test"}, 1)
            mock_counter.assert_called_once_with(endpoint="/test")

    def test_log_event(self):
        """Test logging events"""
        service = MonitoringService()

        with patch("logging.Logger.info") as mock_log:
            service.log_event("test_event", {"user_id": "123"})
            mock_log.assert_called_once()

    def test_get_health_status(self):
        """Test getting health status"""
        service = MonitoringService()

        status = service.get_health_status()
        assert "status" in status
        assert "timestamp" in status


class TestRateLimitingService:
    """Test RateLimitingService class"""

    def test_rate_limiting_service_initialization(self):
        """Test rate limiting service initialization"""
        service = RateLimitingService(
            redis_client=Mock(), default_limit=100, default_window=3600
        )

        assert service.default_limit == 100
        assert service.default_window == 3600

    @pytest.mark.asyncio
    async def test_check_rate_limit(self):
        """Test rate limit checking"""
        mock_redis = Mock()
        service = RateLimitingService(redis_client=mock_redis)

        mock_redis.get.return_value = "50"

        result = await service.check_rate_limit("user123", 100, 3600)
        assert result["allowed"] is True
        assert result["remaining"] == 50

    @pytest.mark.asyncio
    async def test_increment_counter(self):
        """Test counter increment"""
        mock_redis = Mock()
        service = RateLimitingService(redis_client=mock_redis)

        mock_redis.incr.return_value = 51

        result = await service.increment_counter("user123", 3600)
        assert result == 51
        mock_redis.incr.assert_called_once()


class TestRedisClient:
    """Test RedisClient class"""

    def test_redis_client_initialization(self):
        """Test Redis client initialization"""
        client = RedisClient(
            host="localhost", port=6379, db=0, password="test_password"
        )

        assert client.host == "localhost"
        assert client.port == 6379
        assert client.db == 0

    @pytest.mark.asyncio
    async def test_connect(self):
        """Test Redis connection"""
        client = RedisClient()

        with patch("redis.Redis.ping") as mock_ping:
            mock_ping.return_value = True

            await client.connect()
            mock_ping.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_set(self):
        """Test get and set operations"""
        client = RedisClient()

        with patch("redis.Redis.set") as mock_set:
            with patch("redis.Redis.get") as mock_get:
                mock_get.return_value = b"test_value"

                await client.set("test_key", "test_value")
                value = await client.get("test_key")

                mock_set.assert_called_once()
                mock_get.assert_called_once()
                assert value == "test_value"


class TestSecretsManager:
    """Test SecretsManager class"""

    def test_secrets_manager_initialization(self):
        """Test secrets manager initialization"""
        manager = SecretsManager(aws_region="us-east-1", secret_name="test-secret")

        assert manager.aws_region == "us-east-1"
        assert manager.secret_name == "test-secret"

    @pytest.mark.asyncio
    async def test_get_secret(self):
        """Test getting secret"""
        manager = SecretsManager()

        with patch("boto3.client") as mock_boto:
            mock_client = Mock()
            mock_boto.return_value = mock_client
            mock_client.get_secret_value.return_value = {
                "SecretString": '{"key": "value"}'
            }

            secret = await manager.get_secret("test-secret")
            assert secret["key"] == "value"
            mock_client.get_secret_value.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_secret(self):
        """Test updating secret"""
        manager = SecretsManager()

        with patch("boto3.client") as mock_boto:
            mock_client = Mock()
            mock_boto.return_value = mock_client

            await manager.update_secret("test-secret", {"new_key": "new_value"})
            mock_client.update_secret.assert_called_once()


class TestSubscriptionService:
    """Test SubscriptionService class"""

    def test_subscription_service_initialization(self):
        """Test subscription service initialization"""
        service = SubscriptionService(db_session=Mock(), stripe_client=Mock())

        assert service.db_session is not None
        assert service.stripe_client is not None

    def test_create_subscription(self):
        """Test creating subscription"""
        service = SubscriptionService(db_session=Mock(), stripe_client=Mock())

        with patch.object(service, "_create_stripe_subscription") as mock_stripe:
            mock_stripe.return_value = {"id": "sub_123"}

            subscription = service.create_subscription(
                user_id=1, plan_type="premium", payment_method="pm_123"
            )

            assert subscription is not None
            mock_stripe.assert_called_once()

    def test_cancel_subscription(self):
        """Test canceling subscription"""
        service = SubscriptionService(db_session=Mock(), stripe_client=Mock())

        with patch.object(service, "_cancel_stripe_subscription") as mock_cancel:
            mock_cancel.return_value = True

            result = service.cancel_subscription("sub_123")
            assert result is True
            mock_cancel.assert_called_once()

    def test_get_subscription_status(self):
        """Test getting subscription status"""
        service = SubscriptionService(db_session=Mock(), stripe_client=Mock())

        with patch.object(service, "_get_stripe_subscription") as mock_get:
            mock_get.return_value = {"status": "active"}

            status = service.get_subscription_status("sub_123")
            assert status == "active"
            mock_get.assert_called_once()


class TestTokenManager:
    """Test TokenManager class"""

    def test_token_manager_initialization(self):
        """Test token manager initialization"""
        manager = TokenManager(db_session=Mock(), secret_key="test_secret")

        assert manager.secret_key == "test_secret"

    def test_generate_token(self):
        """Test token generation"""
        manager = TokenManager(db_session=Mock(), secret_key="test_secret")

        token = manager.generate_token(user_id=1, token_type="access")
        assert isinstance(token, str)
        assert len(token) > 0

    def test_validate_token(self):
        """Test token validation"""
        manager = TokenManager(db_session=Mock(), secret_key="test_secret")

        # Generate a token
        token = manager.generate_token(user_id=1, token_type="access")

        # Validate the token
        result = manager.validate_token(token)
        assert result is not None
        assert result["user_id"] == 1

    def test_revoke_token(self):
        """Test token revocation"""
        manager = TokenManager(db_session=Mock(), secret_key="test_secret")

        with patch.object(manager, "_revoke_in_database") as mock_revoke:
            mock_revoke.return_value = True

            result = manager.revoke_token("test_token")
            assert result is True
            mock_revoke.assert_called_once()


class TestUserService:
    """Test UserService class"""

    def test_user_service_initialization(self):
        """Test user service initialization"""
        service = UserService(db_session=Mock())
        assert service.db_session is not None

    def test_create_user(self):
        """Test user creation"""
        service = UserService(db_session=Mock())

        with patch.object(service, "_hash_password") as mock_hash:
            mock_hash.return_value = "hashed_password"

            user = service.create_user(
                email="test@example.com",
                password="test_password",
                first_name="John",
                last_name="Doe",
            )

            assert user is not None
            mock_hash.assert_called_once()

    def test_get_user_by_email(self):
        """Test getting user by email"""
        service = UserService(db_session=Mock())

        mock_user = Mock()
        mock_user.email = "test@example.com"

        with patch.object(service.db_session, "query") as mock_query:
            mock_query.return_value.filter.return_value.first.return_value = mock_user

            user = service.get_user_by_email("test@example.com")
            assert user.email == "test@example.com"

    def test_update_user(self):
        """Test user update"""
        service = UserService(db_session=Mock())

        mock_user = Mock()

        with patch.object(service.db_session, "commit") as mock_commit:
            service.update_user(mock_user, {"first_name": "Jane"})
            mock_commit.assert_called_once()

    def test_delete_user(self):
        """Test user deletion"""
        service = UserService(db_session=Mock())

        mock_user = Mock()

        with patch.object(service.db_session, "delete") as mock_delete:
            with patch.object(service.db_session, "commit") as mock_commit:
                service.delete_user(mock_user)
                mock_delete.assert_called_once_with(mock_user)
                mock_commit.assert_called_once()


if __name__ == "__main__":
    pytest.main([__file__])
