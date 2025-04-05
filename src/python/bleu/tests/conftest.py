"""Common test fixtures and configuration."""

import os
from typing import Any, Dict, Generator

import numpy as np
import pytest
import tensorflow as tf
import torch


@pytest.fixture(scope="session")
def random_seed() -> int:
    """Set random seed for reproducibility."""
    seed = 42
    np.random.seed(seed)
    tf.random.set_seed(seed)
    torch.manual_seed(seed)
    return seed


@pytest.fixture(scope="session")
def test_data() -> Dict[str, Any]:
    """Generate test data."""
    return {
        "X": np.random.randn(100, 10),
        "y": np.random.randint(0, 2, 100),
        "sample_text": "This is a sample text for testing.",
        "sample_image": np.random.randn(224, 224, 3),
    }


@pytest.fixture(scope="session")
def test_model() -> tf.keras.Model:
    """Create a simple test model."""
    model = tf.keras.Sequential(
        [
            tf.keras.layers.Dense(64, activation="relu", input_shape=(10,)),
            tf.keras.layers.Dense(32, activation="relu"),
            tf.keras.layers.Dense(1, activation="sigmoid"),
        ]
    )
    model.compile(optimizer="adam", loss="binary_crossentropy")
    return model


@pytest.fixture(scope="session")
def test_env() -> Generator[Dict[str, str], None, None]:
    """Set up test environment variables."""
    env_vars = {
        "BLEU_TEST_MODE": "true",
        "BLEU_LOG_LEVEL": "DEBUG",
        "BLEU_CACHE_DIR": "/tmp/bleu_test_cache",
    }
    original_env = {k: os.environ.get(k) for k in env_vars}
    for k, v in env_vars.items():
        os.environ[k] = v
    yield env_vars
    for k, v in original_env.items():
        if v is None:
            del os.environ[k]
        else:
            os.environ[k] = v


@pytest.fixture(scope="function")
def mock_logger(mocker) -> Any:
    """Create a mock logger."""
    return mocker.patch("bleu.utils.logger")


@pytest.fixture(scope="function")
def mock_quantum_backend(mocker) -> Any:
    """Create a mock quantum backend."""
    return mocker.patch("bleu.quantum.backend")


@pytest.fixture(scope="function")
def mock_ai_model(mocker) -> Any:
    """Create a mock AI model."""
    return mocker.patch("bleu.ai.model")
