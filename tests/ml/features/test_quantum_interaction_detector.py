"""Tests for quantum-enhanced feature interaction detector."""

import numpy as np
import pytest
from sklearn.datasets import make_regression

from src.ml.features.quantum_interaction_detector import QuantumInteractionDetector


@pytest.fixture
def sample_data():
    """Create sample dataset with known interactions."""
    n_samples = 1000
    n_features = 5

    # Generate base features
    X_base, y = make_regression(
        n_samples=n_samples, n_features=n_features, noise=0.1, random_state=42
    )

    # Create interaction features
    X = np.copy(X_base)
    # Add interaction between features 0 and 1
    X[:, 0] = X_base[:, 0] + 0.5 * X_base[:, 1]
    # Add interaction between features 2 and 3
    X[:, 2] = X_base[:, 2] * 0.7 * X_base[:, 3]

    feature_names = [f"feature_{i}" for i in range(n_features)]
    return X, y, feature_names


class MockQuantumProcessor:
    """Mock quantum processor for testing."""

    def prepare_state(self, features):
        """Mock state preparation."""
        return features.mean(axis=0)

    def measure_correlation(self, quantum_state):
        """Mock quantum correlation measurement."""
        return abs(np.mean(quantum_state))


@pytest.fixture
def quantum_processor():
    """Create mock quantum processor."""
    return MockQuantumProcessor()


def test_detector_initialization(quantum_processor):
    """Test detector initialization."""
    detector = QuantumInteractionDetector(quantum_processor)
    assert detector.quantum_processor == quantum_processor
    assert detector.classical_threshold == 0.3
    assert detector.quantum_threshold == 0.2
    assert detector.shap_threshold == 0.1
    assert len(detector.interaction_scores) == 0


def test_classical_correlations(quantum_processor, sample_data):
    """Test classical correlation computation."""
    X, _, feature_names = sample_data
    detector = QuantumInteractionDetector(quantum_processor)

    detector._compute_classical_correlations(X, feature_names)

    assert len(detector.classical_correlations) > 0
    for pair, score in detector.classical_correlations.items():
        assert isinstance(pair, tuple)
        assert len(pair) == 2
        assert isinstance(score, float)
        assert 0 <= score <= 1


def test_quantum_correlations(quantum_processor, sample_data):
    """Test quantum correlation computation."""
    X, _, feature_names = sample_data
    detector = QuantumInteractionDetector(quantum_processor)

    detector._compute_quantum_correlations(X, feature_names)

    assert len(detector.quantum_correlations) > 0
    for pair, score in detector.quantum_correlations.items():
        assert isinstance(pair, tuple)
        assert len(pair) == 2
        assert isinstance(score, float)


def test_shap_interactions(quantum_processor, sample_data):
    """Test SHAP interaction computation."""
    X, y, feature_names = sample_data
    detector = QuantumInteractionDetector(quantum_processor)

    detector._compute_shap_interactions(X, feature_names, y)

    assert len(detector.shap_interactions) > 0
    for pair, score in detector.shap_interactions.items():
        assert isinstance(pair, tuple)
        assert len(pair) == 2
        assert isinstance(score, float)
        assert score >= 0


def test_interaction_detection(quantum_processor, sample_data):
    """Test full interaction detection pipeline."""
    X, y, feature_names = sample_data
    detector = QuantumInteractionDetector(quantum_processor)

    interactions = detector.detect_interactions(X, feature_names, y)

    assert isinstance(interactions, dict)
    assert len(interactions) > 0

    # Check that known interactions are detected
    pairs = set(interactions.keys())
    assert ("feature_0", "feature_1") in pairs
    assert ("feature_2", "feature_3") in pairs


def test_get_top_interactions(quantum_processor, sample_data):
    """Test getting top interactions."""
    X, y, feature_names = sample_data
    detector = QuantumInteractionDetector(quantum_processor)

    detector.detect_interactions(X, feature_names, y)
    top_interactions = detector.get_top_interactions(n=2)

    assert isinstance(top_interactions, list)
    assert len(top_interactions) <= 2
    for pair, score in top_interactions:
        assert isinstance(pair, tuple)
        assert len(pair) == 2
        assert isinstance(score, float)


def test_error_handling(quantum_processor):
    """Test error handling."""
    detector = QuantumInteractionDetector(quantum_processor)

    with pytest.raises(ValueError):
        detector.detect_interactions(None, None)

    with pytest.raises(ValueError):
        X = np.random.rand(10, 3)
        feature_names = ["f1", "f2"]  # Mismatched length
        detector.detect_interactions(X, feature_names)
