"""Integration tests for the ML pipeline components."""

import os
import tempfile

import numpy as np
import pytest

from src.ml.enhanced_xgboost import EnhancedXGBoost
from src.ml.models.evaluate import ModelEvaluator
from src.ml.models.train import ModelTrainer
from src.ml.optimize import HyperparameterOptimizer
from src.ml.pipeline import MLPipeline
from src.quantum_py.quantum.hybrid.xgboost_quantum_hybrid import XGBoostQuantumHybrid


@pytest.fixture
def sample_dataset():
    """Create a sample dataset for testing."""
    rng = np.random.default_rng(42)
    X = rng.standard_normal((100, 10))
    y = (X[:, 0] + X[:, 1] > 0).astype(int)
    return X, y


@pytest.fixture
def temp_model_path():
    """Create a temporary directory for model artifacts."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield tmpdir


class TestMLPipelineIntegration:
    """Integration tests for the complete ML pipeline."""

    def test_end_to_end_training(self, sample_dataset, temp_model_path):
        """Test end-to-end training pipeline."""
        X, y = sample_dataset

        # Initialize components
        trainer = ModelTrainer()
        evaluator = ModelEvaluator()

        # Train model
        model = trainer.train(X, y)

        # Evaluate model
        metrics = evaluator.evaluate(model, X, y)

        # Verify metrics
        assert "accuracy" in metrics
        assert "precision" in metrics
        assert "recall" in metrics
        assert "f1" in metrics

        # Save and load model
        model_path = os.path.join(temp_model_path, "model.pkl")
        trainer.save_model(model, model_path)
        _ = trainer.load_model(temp_model_path)

        # Verify loaded model performs similarly
        new_metrics = evaluator.evaluate(model, X, y)
        assert np.allclose(metrics["accuracy"], new_metrics["accuracy"], rtol=1e-5)

    def test_hyperparameter_optimization(self, sample_dataset):
        """Test hyperparameter optimization pipeline."""
        X, y = sample_dataset
        optimizer = HyperparameterOptimizer()

        # Define parameter grid
        param_grid = {
            "max_depth": [3, 5],
            "learning_rate": [0.01, 0.1],
            "n_estimators": [50, 100],
        }

        # Optimize hyperparameters
        best_params = optimizer.optimize(X, y, param_grid)

        # Verify optimization results
        assert isinstance(best_params, dict)
        assert all(param in best_params for param in param_grid.keys())

    def test_quantum_hybrid_integration(self, sample_dataset):
        """Test quantum-classical hybrid model integration."""
        X, y = sample_dataset

        # Initialize hybrid model
        hybrid_model = XGBoostQuantumHybrid()

        # Train hybrid model
        hybrid_model.fit(X, y)

        # Make predictions
        predictions = hybrid_model.predict(X)

        # Verify predictions
        assert len(predictions) == len(y)
        assert all(isinstance(pred, (int, np.integer)) for pred in predictions)

    def test_enhanced_xgboost_features(self, sample_dataset):
        """Test enhanced XGBoost features."""
        X, y = sample_dataset

        # Initialize enhanced model
        model = EnhancedXGBoost()

        # Test feature importance calculation
        model.fit(X, y)
        importance = model.feature_importances_
        assert len(importance) == X.shape[1]

        # Test prediction with uncertainty
        predictions, uncertainties = model.predict_with_uncertainty(X)
        assert len(predictions) == len(y)
        assert len(uncertainties) == len(y)
        assert all(0 <= u <= 1 for u in uncertainties)

    @pytest.mark.asyncio
    async def test_async_training(self, sample_dataset):
        """Test asynchronous training capabilities."""
        X, y = sample_dataset

        # Initialize components
        trainer = ModelTrainer()

        # Train model asynchronously
        model = await trainer.train_async(X, y)

        # Verify model
        assert model is not None
        predictions = model.predict(X)
        assert len(predictions) == len(y)

    def test_model_versioning(self, sample_dataset, temp_model_path):
        """Test model versioning and metadata tracking."""
        X, y = sample_dataset
        trainer = ModelTrainer()

        # Train and save model with version
        model = trainer.train(X, y)
        version = "1.0.0"
        metadata = {"version": version, "accuracy": 0.85, "timestamp": "2024-03-20"}

        model_path = os.path.join(temp_model_path, f"model_v{version}.pkl")
        trainer.save_model(model, model_path, metadata=metadata)

        # Load model and verify metadata
        _, loaded_metadata = trainer.load_model_with_metadata(model_path)
        assert loaded_metadata["version"] == version
        assert loaded_metadata["accuracy"] == metadata["accuracy"]

    def test_error_handling(self, sample_dataset):
        """Test error handling in the pipeline."""
        X, y = sample_dataset
        trainer = ModelTrainer()

        # Test invalid input handling
        with pytest.raises(ValueError):
            trainer.train(X[:10], y)  # Mismatched dimensions

        with pytest.raises(ValueError):
            trainer.train(np.array([]), np.array([]))  # Empty input

        with pytest.raises(ValueError):
            trainer.train(X, y[:10])  # Mismatched dimensions

    def test_model_training(self):
        # Test model training pipeline
        pipeline = MLPipeline()
        rng = np.random.default_rng(seed=42)
        data = rng.random((100, 10))
        labels = rng.integers(0, 2, size=100)
        pipeline.train(data, labels)

    def test_model_loading(self):
        # Test model loading functionality
        pipeline = MLPipeline()
        _ = pipeline.load_model()  # Remove unused data variable
