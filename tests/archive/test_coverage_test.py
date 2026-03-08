"""Test coverage for new code."""

import pytest
from fastapi.testclient import TestClient

from src.main import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


def test_health_check(client):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert "status" in response.json()


def test_auth_service():
    """Test auth service functions."""
    from src.services.auth_service import (
        create_access_token,
        pwd_context,
        verify_password,
    )

    # Test token creation
    token = create_access_token(data={"sub": "test@example.com"})
    assert isinstance(token, str)
    assert len(token) > 0

    # Test password verification with a fresh hash
    test_password = "testpassword123"
    hashed = pwd_context.hash(test_password)
    assert verify_password(test_password, hashed) is True
    assert verify_password("wrongpassword", hashed) is False


def test_secrets_manager():
    """Test secrets manager."""
    from src.services.secrets_manager import SecretsManager

    secrets = SecretsManager()

    # Test getting secrets
    db_url = secrets.get_database_url()
    assert isinstance(db_url, str)

    jwt_secret = secrets.get_jwt_secret()
    assert isinstance(jwt_secret, str)

    smtp_config = secrets.get_smtp_config()
    assert isinstance(smtp_config, dict)
    assert "host" in smtp_config


def test_quantum_circuit():
    """Test quantum circuit."""
    from src.quantum.core.quantum_circuit import QuantumCircuit, QuantumSimulator

    # Test circuit creation
    circuit = QuantumCircuit(2, "test_circuit")
    assert circuit.num_qubits == 2
    assert circuit.name == "test_circuit"

    # Test adding gates
    circuit.h(0).x(1).cx(0, 1)
    assert len(circuit.gates) == 3

    # Test simulator
    simulator = QuantumSimulator()
    results = simulator.run(circuit, shots=10)
    assert isinstance(results, dict)
    assert len(results) > 0


@pytest.mark.asyncio
async def test_rate_limiting_service():
    """Test rate limiting service."""
    from src.services.rate_limiting_service import RateLimitingService

    # Mock Redis for testing
    class MockRedis:
        def __init__(self):
            self.data = {}

        async def get(self, key):
            return self.data.get(key)

        async def setex(self, key, ttl, value):
            self.data[key] = value

        async def incr(self, key):
            if key not in self.data:
                self.data[key] = 0
            self.data[key] += 1
            return self.data[key]

        async def ttl(self, key):
            return 60  # Mock TTL

    redis = MockRedis()
    service = RateLimitingService(redis)

    # Test rate limit check
    result = await service.check_rate_limit("test_key")
    assert result is False

    # Test status
    status = await service.get_rate_limit_status("test_key")
    assert isinstance(status, dict)
    assert "remaining" in status
    assert "reset" in status
