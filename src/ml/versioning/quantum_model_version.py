"""
Quantum-Aware Model Versioning System
Implements advanced model versioning with quantum state tracking
and integrity verification.
"""

import base64
import hashlib
import json
import logging
import os
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import git
import numpy as np
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

logger = logging.getLogger(__name__)


@dataclass
class QuantumState:
    """Quantum state information for model versioning"""

    n_qubits: int
    circuit_depth: int
    entanglement_pattern: str
    measurement_basis: str
    state_vector: Optional[np.ndarray] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary, handling numpy arrays"""
        data = asdict(self)
        if self.state_vector is not None:
            data["state_vector"] = self.state_vector.tolist()
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "QuantumState":
        """Create from dictionary, handling numpy arrays"""
        if "state_vector" in data and data["state_vector"] is not None:
            data["state_vector"] = np.array(data["state_vector"])
        return cls(**data)


@dataclass
class ModelVersion:
    """Advanced model version information"""

    version_id: str
    timestamp: datetime
    git_commit: str
    model_type: str
    model_hash: str
    quantum_state: Optional[QuantumState]
    hyperparameters: Dict[str, Any]
    metrics: Dict[str, float]
    dependencies: Dict[str, str]
    dataset_hash: str
    feature_importance: Dict[str, float]

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format"""
        return {
            "version_id": self.version_id,
            "timestamp": self.timestamp.isoformat(),
            "git_commit": self.git_commit,
            "model_type": self.model_type,
            "model_hash": self.model_hash,
            "quantum_state": (
                self.quantum_state.to_dict() if self.quantum_state else None
            ),
            "hyperparameters": self.hyperparameters,
            "metrics": self.metrics,
            "dependencies": self.dependencies,
            "dataset_hash": self.dataset_hash,
            "feature_importance": self.feature_importance,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ModelVersion":
        """Create from dictionary format"""
        data = data.copy()
        data["timestamp"] = datetime.fromisoformat(data["timestamp"])
        if data["quantum_state"]:
            data["quantum_state"] = QuantumState.from_dict(data["quantum_state"])
        return cls(**data)


class QuantumModelVersioning:
    """
    Advanced model versioning system with quantum state tracking
    and security features.
    """

    def __init__(self, storage_path: str | Path):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.encryption_key = self._generate_encryption_key()
        self.fernet = Fernet(self.encryption_key)
        self.repo = self._get_git_repo()

    def _generate_encryption_key(self) -> bytes:
        """Generate encryption key for model security"""
        salt = os.urandom(16)  # Generate cryptographically secure random salt
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = kdf.derive(b"quantum_secure_seed")
        return base64.urlsafe_b64encode(key)

    def _get_git_repo(self) -> git.Repo:
        """Get Git repository information"""
        try:
            return git.Repo(search_parent_directories=True)
        except git.InvalidGitRepositoryError:
            logger.warning("Not in a git repository")
            return None

    def _compute_model_hash(self, model: Any) -> str:
        """Compute cryptographic hash of model parameters"""
        model_bytes = self._serialize_model(model)
        return hashlib.sha256(model_bytes).hexdigest()

    def _serialize_model(self, model: Any) -> bytes:
        """Serialize model for storage"""
        try:
            import dill

            return dill.dumps(model)
        except Exception as e:
            logger.error(f"Model serialization failed: {str(e)}")
            raise

    def _deserialize_model(self, model_bytes: bytes) -> Any:
        """Deserialize model from storage"""
        try:
            import dill

            return dill.loads(model_bytes)  # nosec B301 - Trusted model deserialization
        except Exception as e:
            logger.error(f"Model deserialization failed: {str(e)}")
            raise

    def create_version(
        self,
        model: Any,
        model_type: str,
        hyperparameters: Dict[str, Any],
        metrics: Dict[str, float],
        quantum_state: Optional[QuantumState] = None,
        dataset_hash: Optional[str] = None,
        feature_importance: Optional[Dict[str, float]] = None,
    ) -> ModelVersion:
        """Create new model version with quantum state tracking"""
        # Generate version ID
        timestamp = datetime.now()
        version_id = f"{model_type}_{timestamp.strftime('%Y%m%d_%H%M%S')}"

        # Get git commit
        git_commit = self.repo.head.commit.hexsha if self.repo else "no_git_repo"

        # Compute model hash
        model_hash = self._compute_model_hash(model)

        # Get dependencies
        dependencies = self._get_dependencies()

        # Create version info
        version = ModelVersion(
            version_id=version_id,
            timestamp=timestamp,
            git_commit=git_commit,
            model_type=model_type,
            model_hash=model_hash,
            quantum_state=quantum_state,
            hyperparameters=hyperparameters,
            metrics=metrics,
            dependencies=dependencies,
            dataset_hash=dataset_hash or "unknown",
            feature_importance=feature_importance or {},
        )

        # Save version
        self._save_version(version, model)

        return version

    def _get_dependencies(self) -> Dict[str, str]:
        """Get current Python dependencies"""
        import pkg_resources

        return {pkg.key: pkg.version for pkg in pkg_resources.working_set}

    def _save_version(self, version: ModelVersion, model: Any):
        """Save model version and associated data"""
        version_path = self.storage_path / version.version_id
        version_path.mkdir(parents=True, exist_ok=True)

        # Save version metadata
        metadata_path = version_path / "metadata.json"
        with metadata_path.open("w") as f:
            json.dump(version.to_dict(), f, indent=2)

        # Save encrypted model
        model_bytes = self._serialize_model(model)
        encrypted_model = self.fernet.encrypt(model_bytes)
        model_path = version_path / "model.encrypted"
        with model_path.open("wb") as f:
            f.write(encrypted_model)

    def load_version(self, version_id: str) -> Tuple[ModelVersion, Any]:
        """Load model version and associated model"""
        version_path = self.storage_path / version_id

        # Load version metadata
        metadata_path = version_path / "metadata.json"
        with metadata_path.open("r") as f:
            version = ModelVersion.from_dict(json.load(f))

        # Load and decrypt model
        model_path = version_path / "model.encrypted"
        with model_path.open("rb") as f:
            encrypted_model = f.read()
        model_bytes = self.fernet.decrypt(encrypted_model)
        model = self._deserialize_model(model_bytes)

        # Verify model integrity
        current_hash = self._compute_model_hash(model)
        if current_hash != version.model_hash:
            raise ValueError("Model integrity check failed")

        return version, model

    def list_versions(
        self,
        model_type: Optional[str] = None,
        min_metric: Optional[Dict[str, float]] = None,
    ) -> List[ModelVersion]:
        """List available model versions with filtering"""
        versions = []

        for version_path in self.storage_path.glob("**/metadata.json"):
            with version_path.open("r") as f:
                version = ModelVersion.from_dict(json.load(f))

            # Apply filters
            if model_type and version.model_type != model_type:
                continue

            if min_metric:
                if not all(
                    version.metrics.get(k, 0) >= v for k, v in min_metric.items()
                ):
                    continue

            versions.append(version)

        return sorted(versions, key=lambda v: v.timestamp, reverse=True)

    def compare_versions(self, version_id1: str, version_id2: str) -> Dict[str, Any]:
        """Compare two model versions"""
        v1 = self.load_version(version_id1)[0]
        v2 = self.load_version(version_id2)[0]

        return {
            "metrics_diff": {
                k: v2.metrics.get(k, 0) - v1.metrics.get(k, 0)
                for k in set(v1.metrics) | set(v2.metrics)
            },
            "hyperparameters_diff": {
                k: {"v1": v1.hyperparameters.get(k), "v2": v2.hyperparameters.get(k)}
                for k in set(v1.hyperparameters) | set(v2.hyperparameters)
                if v1.hyperparameters.get(k) != v2.hyperparameters.get(k)
            },
            "quantum_state_changed": bool(
                (v1.quantum_state is None) != (v2.quantum_state is None)
                or (
                    v1.quantum_state
                    and v2.quantum_state
                    and v1.quantum_state.to_dict() != v2.quantum_state.to_dict()
                )
            ),
            "feature_importance_diff": {
                k: v2.feature_importance.get(k, 0) - v1.feature_importance.get(k, 0)
                for k in set(v1.feature_importance) | set(v2.feature_importance)
            },
        }
