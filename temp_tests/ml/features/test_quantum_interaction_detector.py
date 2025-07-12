"""Tests for quantum-enhanced feature interaction detector."""

import numpy as np
import pytest
from sklearn.datasets import make_regression

from src.ml.features.quantum_interaction_detector import (
    QuantumInteractionConfig,
    QuantumInteractionDetector,
)


@pytest.fixture
def sample_data():
    """Create sample dataset with known interactions."""
    n_samples = 1000
    n_features = 5

    # Generate base features
    x_base, y = make_regression(
        n_samples=n_samples, n_features=n_features, noise=0.1, random_state=42
    )

    # Create interaction features
    X = np.copy(x_base)
    # Add interaction between features 0 and 1
    X[:, 0] = x_base[:, 0] + 0.5 * x_base[:, 1]
    # Add interaction between features 2 and 3
    X[:, 2] = x_base[:, 2] * 0.7 * x_base[:, 3]

    return X, y


@pytest.fixture
def config():
    """Create detector config."""
    return QuantumInteractionConfig(
        n_qubits=4,
        n_shots=1000,
        entanglement_threshold=0.1,
        correlation_threshold=0.7,
        max_interaction_order=2,
        min_effect_size=0.05,
        use_quantum_correlation=True,
    )


class MockQuantumProcessor:
    """Mock quantum processor for testing."""

    def __init__(self):
        self.call_count = 0

    def measure_correlation(self, x1, x2, n_shots=1000):
        """Mock quantum correlation measurement."""
        self.call_count += 1
        # Return higher correlation for known interactions
        if (x1[0] == x2[0] and x1[1] == x2[1]) or (x1[2] == x2[2] and x1[3] == x2[3]):
            return 0.8
        return 0.1


def test_detector_initialization(config):
    """Test detector initialization."""
    detector = QuantumInteractionDetector(config)
    assert detector.config == config
    assert detector.quantum_processor is None
    assert len(detector.interaction_scores) == 0
    assert len(detector.feature_importances) == 0
    assert detector.quantum_correlations is None


def test_classical_correlations(config, sample_data):
    """Test classical correlation computation."""
    X, _ = sample_data
    detector = QuantumInteractionDetector(config)

    correlations = detector._compute_classical_correlations(X)

    assert isinstance(correlations, np.ndarray)
    assert correlations.shape == (X.shape[1], X.shape[1])
    assert np.allclose(correlations, correlations.T)  # Symmetric
    assert np.allclose(np.diag(correlations), 1.0)  # Diagonal is 1


def test_quantum_correlations(config, sample_data):
    """Test quantum correlation computation."""
    X, _ = sample_data
    quantum_processor = MockQuantumProcessor()
    detector = QuantumInteractionDetector(config, quantum_processor)

    correlations = detector._compute_quantum_correlations(X)

    assert isinstance(correlations, np.ndarray)
    assert correlations.shape == (X.shape[1], X.shape[1])
    assert np.allclose(correlations, correlations.T)  # Symmetric

    # Check that known interactions have higher correlations
    assert correlations[0, 1] > 0.7  # Known interaction
    assert correlations[2, 3] > 0.7  # Known interaction
    assert correlations[1, 4] < 0.2  # No interaction


def test_shap_interactions(config, sample_data):
    """Test SHAP interaction computation."""
    X, y = sample_data
    detector = QuantumInteractionDetector(config)

    interactions = detector._compute_shap_interactions(X, y)

    assert isinstance(interactions, np.ndarray)
    assert interactions.shape == (X.shape[1], X.shape[1])
    assert np.all(interactions >= 0)  # Absolute values


def test_interaction_detection(config, sample_data):
    """Test full interaction detection pipeline."""
    X, y = sample_data
    quantum_processor = MockQuantumProcessor()
    detector = QuantumInteractionDetector(config, quantum_processor)

    feature_names = [f"feature_{i}" for i in range(X.shape[1])]
    results = detector.detect_interactions(X, y, feature_names)

    assert "interactions" in results
    assert "metadata" in results

    # Check that known interactions are detected
    interactions = results["interactions"]
    interaction_pairs = {tuple(k.split(" × ")) for k in interactions.keys()}
    assert ("feature_0", "feature_1") in interaction_pairs
    assert ("feature_2", "feature_3") in interaction_pairs

    # Check metadata
    assert results["metadata"]["quantum_enhanced"]
    assert results["metadata"]["n_interactions_detected"] > 0


def test_interaction_strength_classification(config, sample_data):
    """Test interaction strength classification."""
    X, y = sample_data
    detector = QuantumInteractionDetector(config)

    results = detector.detect_interactions(X, y)

    # Check strength classifications
    for interaction_info in results["interactions"].values():
        assert interaction_info["strength"] in ["strong", "moderate"]
        if interaction_info["score"] > config.correlation_threshold:
            assert interaction_info["strength"] == "strong"
        else:
            assert interaction_info["strength"] == "moderate"


def test_feature_importance_tracking(config, sample_data):
    """Test feature importance tracking."""
    X, y = sample_data
    detector = QuantumInteractionDetector(config)

    detector.detect_interactions(X, y)

    # Check feature importances
    assert len(detector.feature_importances) > 0
    assert all(isinstance(v, float) for v in detector.feature_importances.values())
    assert all(v >= 0 for v in detector.feature_importances.values())


def test_error_handling(config):
    """Test error handling."""
    detector = QuantumInteractionDetector(config)

    # Test with invalid input
    with pytest.raises(ValueError):
        detector.detect_interactions(None, None)

    # Test with mismatched dimensions
    rng = np.random.default_rng()
    X = rng.random((10, 3))
    y = rng.random(5)
    with pytest.raises(ValueError):
        detector.detect_interactions(X, y)


def test_quantum_processor_fallback(config, sample_data):
    """Test fallback behavior when quantum processor fails."""
    X, y = sample_data

    class FailingQuantumProcessor:
        def measure_correlation(self, *args, **kwargs):
            raise RuntimeError("Quantum processor failure")

    detector = QuantumInteractionDetector(
        config, quantum_processor=FailingQuantumProcessor()
    )

    # Should still work, falling back to classical methods
    results = detector.detect_interactions(X, y)
    assert not results["metadata"]["quantum_enhanced"]
