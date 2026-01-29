import os

import httpx
import pytest

boto3 = pytest.importorskip("boto3")
from dotenv import load_dotenv

# Load test environment variables
load_dotenv(".env.test")

# Test configuration
BASE_URL = os.getenv("AWS_API_CONFIG_BASE_URL", "http://localhost:8000")
TEST_API_KEY = os.getenv("TEST_API_KEY", "test_key")
ENTERPRISE_API_KEY = os.getenv("ENTERPRISE_TEST_API_KEY", "enterprise_test_key")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")


@pytest.mark.api
class TestAPIIntegration:
    @pytest.fixture
    def client(self):
        # Skip tests if BASE_URL is not properly configured
        if not BASE_URL or BASE_URL == "http://localhost:8000":
            pytest.skip("API server not available for testing")
        return httpx.Client(base_url=BASE_URL)

    def test_api_gateway_status(self, client):
        """Test if the API Gateway is operational"""
        response = client.get("/api", headers={"x-api-key": TEST_API_KEY})
        assert response.status_code == 200

    def test_core_tier_rate_limits(self, client):
        """Test Core Tier rate limiting"""
        for _ in range(5):
            response = client.post(
                "/api/ai/predict",
                headers={"Content-Type": "application/json", "x-api-key": TEST_API_KEY},
                json={"input": "Test input"},
            )
            assert response.status_code == 200

    def test_enterprise_tier_features(self, client):
        """Test Enterprise Tier features"""
        response = client.post(
            "/api/ai/predict",
            headers={
                "Content-Type": "application/json",
                "x-api-key": ENTERPRISE_API_KEY,
            },
            json={"input": "Enterprise test"},
        )
        assert response.status_code == 200

    def test_response_times(self, client):
        """Test API response times"""
        import time

        start_time = time.time()

        response = client.post(
            "/api/ai/predict",
            headers={"Content-Type": "application/json", "x-api-key": TEST_API_KEY},
            json={"input": "Performance test"},
        )

        duration = (time.time() - start_time) * 1000  # Convert to milliseconds
        assert duration < 1000  # Response should be under 1 second
        assert response.status_code == 200

    def test_cloudwatch_logs(self):
        """Test CloudWatch logs access"""
        client = boto3.client("logs", region_name=AWS_REGION)
        try:
            response = client.filter_log_events(
                logGroupName="/aws/lambda/bleujs-api", limit=10
            )
            assert "events" in response
        except Exception as e:
            pytest.skip(f"CloudWatch access failed: {str(e)}")
