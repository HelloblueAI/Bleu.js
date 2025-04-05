import os
import shutil
import tempfile
from pathlib import Path

import pytest


@pytest.fixture(scope="session")
def test_dir():
    """Create a temporary directory for test files."""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir)


@pytest.fixture(scope="session")
def test_config(test_dir):
    """Create a test configuration."""
    return {
        "num_qubits": 4,
        "error_correction_enabled": True,
        "optimization_level": "medium",
        "storage_path": test_dir,
        "model_path": os.path.join(test_dir, "models"),
        "log_path": os.path.join(test_dir, "logs"),
        "cache_path": os.path.join(test_dir, "cache"),
    }


@pytest.fixture(scope="session")
def setup_test_environment(test_dir, test_config):
    """Set up the test environment with necessary directories."""
    # Create necessary directories
    for path in [
        test_config["model_path"],
        test_config["log_path"],
        test_config["cache_path"],
    ]:
        Path(path).mkdir(parents=True, exist_ok=True)

    yield test_config

    # Cleanup will be handled by the test_dir fixture


@pytest.fixture(scope="function")
def mock_tensorflow():
    """Mock TensorFlow for testing."""
    import tensorflow as tf

    tf.config.run_functions_eagerly(True)
    yield tf
    tf.config.run_functions_eagerly(False)


@pytest.fixture(scope="function")
def mock_numpy():
    """Mock NumPy for testing."""
    import numpy as np

    np.random.seed(42)  # For reproducibility
    yield np
