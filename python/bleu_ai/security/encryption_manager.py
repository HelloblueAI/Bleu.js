"""
Encryption Manager Implementation
Provides secure data handling and model protection capabilities.
"""

import base64
import json
import logging
import os
from pathlib import Path
from typing import Dict, Optional, Tuple, Union

import msgpack
import numpy as np
import torch
import torch.nn as nn
from cryptography.fernet import Fernet
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


class EncryptionManager:
    def __init__(
        self,
        key: Optional[bytes] = None,
        salt: Optional[bytes] = None,
        iterations: int = 100000,
    ):
        self.iterations = iterations
        self.key = key
        self.salt = salt or os.urandom(16)
        self.cipher_suite: Optional[Fernet] = None
        self.initialized = False
        self.signing_key: Optional[bytes] = None

    async def initialize(self):
        """Initialize the encryption manager."""
        try:
            if self.key is None:
                # Generate key using PBKDF2
                kdf = PBKDF2HMAC(
                    algorithm=hashes.SHA256(),
                    length=32,
                    salt=self.salt,
                    iterations=self.iterations,
                    backend=default_backend(),
                )
                self.key = base64.urlsafe_b64encode(kdf.derive(os.urandom(32)))

            self.cipher_suite = Fernet(self.key)
            self.initialized = True
            logging.info("✅ Encryption manager initialized successfully")
        except Exception as e:
            logging.error(f"❌ Failed to initialize encryption manager: {str(e)}")
            raise

    async def encryptData(
        self, data: Union[np.ndarray, torch.Tensor, Dict], data_type: str = "numpy"
    ) -> bytes:
        """Encrypt data using Fernet symmetric encryption."""
        try:
            if not self.initialized or self.cipher_suite is None:
                await self.initialize()

            # Convert data to bytes using msgpack for binary data
            if data_type == "numpy":
                data_bytes = msgpack.packb(
                    {
                        "data": data.tobytes(),
                        "shape": data.shape,
                        "dtype": str(data.dtype),
                    }
                )
            elif data_type == "torch":
                data_bytes = msgpack.packb(
                    {
                        "data": data.cpu().numpy().tobytes(),
                        "shape": data.shape,
                        "dtype": str(data.dtype),
                        "requires_grad": data.requires_grad,
                    }
                )
            elif data_type == "dict":
                data_bytes = json.dumps(data).encode()
            else:
                raise ValueError(f"Unsupported data type: {data_type}")

            # Encrypt data
            if self.cipher_suite is None:
                raise ValueError("Cipher suite not initialized")
            encrypted_data = self.cipher_suite.encrypt(data_bytes)
            return encrypted_data

        except Exception as e:
            logging.error(f"❌ Data encryption failed: {str(e)}")
            raise

    async def decryptData(
        self, encrypted_data: bytes, data_type: str = "numpy"
    ) -> Union[np.ndarray, torch.Tensor, Dict]:
        """Decrypt data using Fernet symmetric encryption."""
        try:
            if not self.initialized or self.cipher_suite is None:
                await self.initialize()

            # Decrypt data
            if self.cipher_suite is None:
                raise ValueError("Cipher suite not initialized")
            decrypted_data = self.cipher_suite.decrypt(encrypted_data)

            # Convert back to original type
            if data_type == "numpy":
                data_dict = msgpack.unpackb(decrypted_data)
                return np.frombuffer(
                    data_dict["data"], dtype=np.dtype(data_dict["dtype"])
                ).reshape(data_dict["shape"])
            elif data_type == "torch":
                data_dict = msgpack.unpackb(decrypted_data)
                tensor = torch.from_numpy(
                    np.frombuffer(
                        data_dict["data"], dtype=np.dtype(data_dict["dtype"])
                    ).reshape(data_dict["shape"])
                )
                tensor.requires_grad = data_dict["requires_grad"]
                return tensor
            elif data_type == "dict":
                return json.loads(decrypted_data.decode())
            else:
                raise ValueError(f"Unsupported data type: {data_type}")

        except Exception as e:
            logging.error(f"❌ Data decryption failed: {str(e)}")
            raise

    async def encryptModel(
        self, model: nn.Module, save_path: Optional[str] = None
    ) -> bytes:
        """Encrypt PyTorch model state."""
        try:
            if not self.initialized or self.cipher_suite is None:
                await self.initialize()

            # Get model state and convert to bytes using msgpack
            model_state = {
                name: param.cpu().numpy() for name, param in model.state_dict().items()
            }
            model_bytes = msgpack.packb(
                {
                    name: {
                        "data": tensor.tobytes(),
                        "shape": tensor.shape,
                        "dtype": str(tensor.dtype),
                    }
                    for name, tensor in model_state.items()
                }
            )

            # Encrypt model
            if self.cipher_suite is None:
                raise ValueError("Cipher suite not initialized")
            encrypted_model = self.cipher_suite.encrypt(model_bytes)

            # Save if path provided
            if save_path:
                path = Path(save_path)
                if path.parent is not None:
                    path.parent.mkdir(parents=True, exist_ok=True)
                with open(path, "wb") as f:
                    f.write(encrypted_model)
                logging.info(f"✅ Encrypted model saved to {path}")

            return encrypted_model

        except Exception as e:
            logging.error(f"❌ Model encryption failed: {str(e)}")
            raise

    async def decryptModel(
        self,
        model: nn.Module,
        encrypted_model: Union[bytes, str],
        load_path: Optional[str] = None,
    ) -> nn.Module:
        """Decrypt and load PyTorch model state."""
        try:
            if not self.initialized or self.cipher_suite is None:
                await self.initialize()

            # Load encrypted model if path provided
            if load_path:
                with open(load_path, "rb") as f:
                    encrypted_model = f.read()

            # Decrypt model
            if self.cipher_suite is None:
                raise ValueError("Cipher suite not initialized")
            decrypted_model = self.cipher_suite.decrypt(encrypted_model)

            # Unpack model state using msgpack
            model_state_dict = msgpack.unpackb(decrypted_model)
            model_state = {
                name: torch.from_numpy(
                    np.frombuffer(
                        state["data"], dtype=np.dtype(state["dtype"])
                    ).reshape(state["shape"])
                )
                for name, state in model_state_dict.items()
            }

            # Load state dict
            model.load_state_dict(model_state)
            return model

        except Exception as e:
            logging.error(f"❌ Model decryption failed: {str(e)}")
            raise

    async def encryptFile(
        self, file_path: str, output_path: Optional[str] = None
    ) -> bytes:
        """Encrypt file contents."""
        try:
            if not self.initialized or self.cipher_suite is None:
                await self.initialize()

            # Read file
            with open(file_path, "rb") as f:
                file_data = f.read()

            # Encrypt file
            if self.cipher_suite is None:
                raise ValueError("Cipher suite not initialized")
            encrypted_data = self.cipher_suite.encrypt(file_data)

            # Save if output path provided
            if output_path:
                path = Path(output_path)
                if path.parent is not None:
                    path.parent.mkdir(parents=True, exist_ok=True)
                with open(path, "wb") as f:
                    f.write(encrypted_data)
                logging.info(f"✅ Encrypted file saved to {path}")

            return encrypted_data

        except Exception as e:
            logging.error(f"❌ File encryption failed: {str(e)}")
            raise

    async def decryptFile(
        self, encrypted_data: Union[bytes, str], output_path: Optional[str] = None
    ) -> bytes:
        """Decrypt file contents."""
        try:
            if not self.initialized or self.cipher_suite is None:
                await self.initialize()

            # Load encrypted data if path provided
            if isinstance(encrypted_data, str):
                with open(encrypted_data, "rb") as f:
                    encrypted_data = f.read()

            # Decrypt data
            if self.cipher_suite is None:
                raise ValueError("Cipher suite not initialized")
            decrypted_data = self.cipher_suite.decrypt(encrypted_data)

            # Save if output path provided
            if output_path:
                path = Path(output_path)
                if path.parent is not None:
                    path.parent.mkdir(parents=True, exist_ok=True)
                with open(path, "wb") as f:
                    f.write(decrypted_data)
                logging.info(f"✅ Decrypted file saved to {path}")

            return decrypted_data

        except Exception as e:
            logging.error(f"❌ File decryption failed: {str(e)}")
            raise

    async def secureDataTransfer(
        self,
        data: Union[np.ndarray, torch.Tensor, Dict],
        recipient_key: bytes,
        data_type: str = "numpy",
    ) -> Tuple[bytes, bytes]:
        """Securely transfer data to another party."""
        try:
            if not self.initialized or self.cipher_suite is None:
                await self.initialize()

            # Encrypt data
            if self.cipher_suite is None:
                raise ValueError("Cipher suite not initialized")
            encrypted_data = await self.encryptData(data, data_type)

            # Sign data
            if self.signing_key is None:
                raise ValueError("Signing key not initialized")
            signature = self.signing_key.sign(encrypted_data)

            return encrypted_data, signature

        except Exception as e:
            logging.error(f"❌ Secure data transfer failed: {str(e)}")
            raise

    async def verifyDataIntegrity(self, data: bytes, signature: bytes) -> bool:
        """Verify data integrity using signature."""
        try:
            if not self.initialized or self.cipher_suite is None:
                await self.initialize()

            # Create signing object
            if self.cipher_suite is None:
                raise ValueError("Cipher suite not initialized")
            signing_key = self.cipher_suite.signing_key
            if signing_key is None:
                raise ValueError("Signing key not initialized")

            # Verify signature
            try:
                signing_key.verify(data, signature)
                return True
            except Exception:
                return False

        except Exception as e:
            logging.error(f"❌ Data integrity verification failed: {str(e)}")
            raise

    async def dispose(self):
        """Clean up resources."""
        try:
            self.key = None
            self.salt = None
            self.cipher_suite = None
            self.initialized = False
            self.signing_key = None
            logging.info("✅ Encryption manager resources cleaned up")
        except Exception as e:
            logging.error(f"❌ Failed to clean up encryption manager: {str(e)}")
            raise
