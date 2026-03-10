"""
Tests for Bleu.js security module (QuantumSecurityManager, sync wrappers).
"""

import pytest

try:
    from bleujs.security import QuantumSecurityManager

    SECURITY_AVAILABLE = True
except ImportError:
    SECURITY_AVAILABLE = False


@pytest.fixture
def manager():
    """QuantumSecurityManager instance (standard level)."""
    if not SECURITY_AVAILABLE:
        pytest.skip("bleujs.security not available")
    return QuantumSecurityManager(encryption_level="standard", quantum_resistant=False)


class TestEncryptSync:
    """Test encrypt_sync wrapper."""

    def test_encrypt_sync_returns_dict(self, manager):
        """encrypt_sync returns a dict with encrypted, data, algorithm."""
        result = manager.encrypt_sync({"foo": "bar"})
        assert isinstance(result, dict)
        assert "encrypted" in result
        assert result["encrypted"] is True
        assert "data" in result
        assert "algorithm" in result

    def test_encrypt_sync_deterministic_or_consistent(self, manager):
        """encrypt_sync can be called twice without error."""
        r1 = manager.encrypt_sync("test")
        r2 = manager.encrypt_sync("test")
        assert r1["encrypted"] is True and r2["encrypted"] is True


class TestGenerateHashesSync:
    """Test generate_hashes_sync wrapper."""

    def test_generate_hashes_sync_returns_dict(self, manager):
        """generate_hashes_sync returns dict with sha256, sha512."""
        result = manager.generate_hashes_sync("hello")
        assert isinstance(result, dict)
        assert "sha256" in result
        assert "sha512" in result
        assert len(result["sha256"]) == 64
        assert len(result["sha512"]) == 128

    def test_generate_hashes_sync_deterministic(self, manager):
        """Same input gives same hashes."""
        r1 = manager.generate_hashes_sync("same")
        r2 = manager.generate_hashes_sync("same")
        assert r1["sha256"] == r2["sha256"]
        assert r1["sha512"] == r2["sha512"]


class TestVerifyIntegritySync:
    """Test verify_integrity_sync (basic call)."""

    def test_verify_integrity_sync_returns_dict(self, manager):
        """verify_integrity_sync returns a dict."""
        enc = manager.encrypt_sync("data")
        hashes = manager.generate_hashes_sync("data")
        result = manager.verify_integrity_sync("data", enc, hashes)
        assert isinstance(result, dict)
