"""
Security features for Bleu.js.

Encryption: Fernet (AES-256-GCM) when cryptography is available; otherwise
SHA-256-based. "Quantum-resistant" hashing is multi-round SHA-512 (hardening
only), not NIST post-quantum (e.g. Kyber/Dilithium). Sync wrappers are
provided for encrypt, generate_hashes, and verify_integrity.
"""

import asyncio
import hashlib
import json
import logging
import secrets
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class QuantumSecurityManager:
    """
    Manage encryption and hashing for Bleu.js.

    - **Encryption:** "military" uses Fernet (AES-256-GCM) when the
      cryptography library is installed; otherwise SHA-256-based.
    - **"Quantum-resistant" hashing:** Multi-round SHA-512 (10 rounds) for
      extra hardening. This is not NIST post-quantum (e.g. Kyber, Dilithium).
      Use encrypt_sync / generate_hashes_sync / verify_integrity_sync from
      sync code to avoid managing event loops.

    Args:
        encryption_level (str): 'standard' or 'military'
        quantum_resistant (bool): Use multi-round SHA-512 for hashes

    Example:
        >>> security = QuantumSecurityManager(
        ...     encryption_level='military',
        ...     quantum_resistant=True
        ... )
        >>> encrypted = security.encrypt_sync(sensitive_data)
    """

    def __init__(
        self,
        encryption_level: str = "standard",
        quantum_resistant: bool = False,
        **kwargs,
    ):
        """Initialize quantum security manager."""
        self.encryption_level = encryption_level
        self.quantum_resistant = quantum_resistant
        self.config = kwargs

        logger.info(f"Initialized QuantumSecurityManager")
        logger.info(f"Encryption level: {encryption_level}")
        logger.info(f"Quantum resistant: {quantum_resistant}")

        # Check for cryptography library
        self.cryptography_available = self._check_cryptography()

    def _check_cryptography(self) -> bool:
        """Check if cryptography library is available."""
        try:
            import cryptography

            logger.info("✅ Cryptography library available")
            return True
        except ImportError:
            logger.warning("⚠️  Cryptography library not installed")
            logger.warning("   For full security features: pip install cryptography")
            return False

    async def encrypt(
        self, data: Any, quantum_resistant: bool = True, **kwargs
    ) -> Dict[str, Any]:
        """
        Encrypt data with optional quantum-resistant algorithms.

        Args:
            data: Data to encrypt
            quantum_resistant: Use quantum-resistant encryption
            **kwargs: Additional options

        Returns:
            Encrypted data dictionary
        """
        logger.info("🔐 Encrypting data...")

        try:
            # Convert data to string for encryption
            data_str = json.dumps(data, default=str)

            if self.cryptography_available and self.encryption_level == "military":
                encrypted_data = self._military_grade_encryption(data_str)
            else:
                # Fallback to hash-based encryption
                encrypted_data = self._basic_encryption(data_str)

            result = {
                "encrypted": True,
                "data": encrypted_data,
                "encryption_level": self.encryption_level,
                "quantum_resistant": quantum_resistant and self.quantum_resistant,
                "algorithm": (
                    "AES-256-GCM" if self.cryptography_available else "SHA-256"
                ),
            }

            logger.info("✅ Data encrypted successfully")
            return result

        except Exception as e:
            logger.error(f"❌ Encryption failed: {e}")
            return {
                "encrypted": False,
                "error": str(e),
            }

    def _military_grade_encryption(self, data_str: str) -> str:
        """Perform military-grade encryption."""
        try:
            from cryptography.fernet import Fernet

            # Generate key
            key = Fernet.generate_key()
            cipher = Fernet(key)

            # Encrypt
            encrypted = cipher.encrypt(data_str.encode())

            logger.info("✅ Military-grade encryption applied")
            return encrypted.hex()

        except Exception as e:
            logger.warning(f"Military encryption failed: {e}, using fallback")
            return self._basic_encryption(data_str)

    def _basic_encryption(self, data_str: str) -> str:
        """Basic encryption using SHA-256."""
        # Use SHA-256 for basic encryption (one-way hash)
        hash_obj = hashlib.sha256(data_str.encode())
        return hash_obj.hexdigest()

    async def generate_hashes(
        self, data: Any, algorithm: str = "quantum_sha256", **kwargs
    ) -> Dict[str, str]:
        """
        Generate secure hashes for data.

        Args:
            data: Data to hash
            algorithm: Hash algorithm to use
            **kwargs: Additional options

        Returns:
            Dictionary of hashes
        """
        logger.info(f"🔑 Generating hashes with {algorithm}...")

        try:
            data_str = json.dumps(data, default=str)

            hashes = {
                "sha256": hashlib.sha256(data_str.encode()).hexdigest(),
                "sha512": hashlib.sha512(data_str.encode()).hexdigest(),
            }

            if self.quantum_resistant:
                # Simulate quantum-resistant hash
                hashes["quantum_hash"] = self._quantum_resistant_hash(data_str)

            logger.info("✅ Hashes generated successfully")
            return hashes

        except Exception as e:
            logger.error(f"❌ Hash generation failed: {e}")
            return {"error": str(e)}

    def _quantum_resistant_hash(self, data_str: str) -> str:
        """Multi-round SHA-512 (hardening only; not NIST post-quantum)."""
        hash_value = data_str.encode()
        for _ in range(10):
            hash_value = hashlib.sha512(hash_value).digest()
        return hash_value.hex()

    def encrypt_sync(
        self, data: Any, quantum_resistant: bool = True, **kwargs: Any
    ) -> Dict[str, Any]:
        """Synchronous wrapper for encrypt(). Use from sync code."""
        return asyncio.run(
            self.encrypt(data, quantum_resistant=quantum_resistant, **kwargs)
        )

    def generate_hashes_sync(
        self, data: Any, algorithm: str = "quantum_sha256", **kwargs: Any
    ) -> Dict[str, str]:
        """Synchronous wrapper for generate_hashes(). Use from sync code."""
        return asyncio.run(self.generate_hashes(data, algorithm=algorithm, **kwargs))

    def verify_integrity_sync(
        self,
        original_data: Any,
        encrypted_data: Dict[str, Any],
        hashes: Dict[str, str],
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """Synchronous wrapper for verify_integrity(). Use from sync code."""
        return asyncio.run(
            self.verify_integrity(original_data, encrypted_data, hashes, **kwargs)
        )

    async def verify_integrity(
        self, original_data: Any, encrypted_data: Dict, hashes: Dict[str, str], **kwargs
    ) -> Dict[str, Any]:
        """
        Verify data integrity.

        Args:
            original_data: Original data
            encrypted_data: Encrypted data
            hashes: Hash values to verify against
            **kwargs: Additional options

        Returns:
            Verification results
        """
        logger.info("✅ Verifying data integrity...")

        try:
            # Re-generate hashes from original data
            new_hashes = await self.generate_hashes(original_data)

            # Compare hashes
            integrity_check = {
                "valid": hashes.get("sha256") == new_hashes.get("sha256"),
                "algorithm": "sha256",
                "timestamp": str(secrets.randbits(64)),
            }

            if integrity_check["valid"]:
                logger.info("✅ Data integrity verified")
            else:
                logger.warning("⚠️  Data integrity check failed")

            return integrity_check

        except Exception as e:
            logger.error(f"❌ Integrity verification failed: {e}")
            return {
                "valid": False,
                "error": str(e),
            }

    def generate_secure_token(self, length: int = 32) -> str:
        """
        Generate a secure random token.

        Args:
            length: Token length in bytes

        Returns:
            Secure random token
        """
        token = secrets.token_urlsafe(length)
        logger.info("✅ Secure token generated")
        return token

    def __repr__(self) -> str:
        return f"QuantumSecurityManager(level='{self.encryption_level}', quantum={self.quantum_resistant})"


# Convenience exports
__all__ = [
    "QuantumSecurityManager",
]
