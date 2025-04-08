"""Machine learning pipeline module."""

from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
from sklearn.base import BaseEstimator
from sklearn.preprocessing import StandardScaler

from src.ml.factory import ModelFactory
from src.ml.metrics import PerformanceMetrics
from src.services.model_service import ModelService


class MLPipeline:
    """Machine learning pipeline for training and inference."""

    def __init__(
        self,
        model_type: str,
        model_config: Optional[Dict[str, Any]] = None,
        scale_features: bool = True,
    ) -> None:
        """Initialize ML pipeline.

        Args:
            model_type: Type of model to use
            model_config: Model configuration parameters (optional)
            scale_features: Whether to scale features (default: True)
        """
        self.model_service = ModelFactory.create_model(
            model_type=model_type,
            model_config=model_config,
            return_service=True,
        )
        self.scale_features = scale_features
        self.scaler = StandardScaler() if scale_features else None
        self.is_trained = False

    def preprocess(
        self,
        X: np.ndarray,
        fit: bool = False,
    ) -> np.ndarray:
        """Preprocess feature matrix.

        Args:
            X: Feature matrix
            fit: Whether to fit scaler (default: False)

        Returns:
            np.ndarray: Preprocessed feature matrix
        """
        if self.scale_features and self.scaler is not None:
            if fit:
                return self.scaler.fit_transform(X)
            return self.scaler.transform(X)
        return X

    def train(
        self,
        X: np.ndarray,
        y: np.ndarray,
        param_grid: Optional[Dict[str, Any]] = None,
        test_size: float = 0.2,
        random_state: Optional[int] = None,
        optimize: bool = False,
        optimization_method: str = "grid",
        **optimization_params: Any,
    ) -> Dict[str, Any]:
        """Train pipeline.

        Args:
            X: Feature matrix
            y: Target vector
            param_grid: Parameter grid for optimization (optional)
            test_size: Test set size (default: 0.2)
            random_state: Random state for reproducibility
            optimize: Whether to perform hyperparameter optimization
            optimization_method: Optimization method ("grid" or "random")
            **optimization_params: Additional optimization parameters

        Returns:
            Dict[str, Any]: Training results
        """
        # Preprocess features
        X_processed = self.preprocess(X, fit=True)

        # Train model
        training_info = self.model_service.train(
            X=X_processed,
            y=y,
            param_grid=param_grid,
            test_size=test_size,
            random_state=random_state,
            optimize=optimize,
            optimization_method=optimization_method,
            **optimization_params,
        )

        self.is_trained = True
        return training_info

    def predict(
        self, X: np.ndarray, return_proba: bool = False
    ) -> Union[np.ndarray, Tuple[np.ndarray, np.ndarray]]:
        """Make predictions.

        Args:
            X: Feature matrix
            return_proba: Whether to return probability scores

        Returns:
            Union[np.ndarray, Tuple[np.ndarray, np.ndarray]]: Predictions and probabilities
        """
        if not self.is_trained:
            raise RuntimeError("Pipeline must be trained before making predictions")

        # Preprocess features
        X_processed = self.preprocess(X)

        # Make predictions
        return self.model_service.predict(X_processed, return_proba=return_proba)

    def evaluate(
        self,
        X: np.ndarray,
        y: np.ndarray,
        return_proba: bool = True,
    ) -> Tuple[PerformanceMetrics, Dict[str, Any]]:
        """Evaluate pipeline performance.

        Args:
            X: Feature matrix
            y: Target vector
            return_proba: Whether to include probability scores in evaluation

        Returns:
            Tuple[PerformanceMetrics, Dict[str, Any]]: Performance metrics and evaluation info
        """
        if not self.is_trained:
            raise RuntimeError("Pipeline must be trained before evaluation")

        # Preprocess features
        X_processed = self.preprocess(X)

        # Evaluate model
        return self.model_service.evaluate(
            X=X_processed,
            y=y,
            return_proba=return_proba,
        )

    def cross_validate(
        self,
        X: np.ndarray,
        y: np.ndarray,
        cv: int = 5,
        scoring: Optional[List[str]] = None,
    ) -> Dict[str, List[float]]:
        """Perform cross-validation.

        Args:
            X: Feature matrix
            y: Target vector
            cv: Number of folds (default: 5)
            scoring: List of scoring metrics (default: None)

        Returns:
            Dict[str, List[float]]: Cross-validation scores
        """
        # Preprocess features
        X_processed = self.preprocess(X, fit=True)

        # Perform cross-validation
        return self.model_service.cross_validate(
            X=X_processed,
            y=y,
            cv=cv,
            scoring=scoring,
        )

    def save_pipeline(self, model_path: str, scaler_path: Optional[str] = None) -> None:
        """Save pipeline to files.

        Args:
            model_path: Path to save model
            scaler_path: Path to save scaler (optional)
        """
        if not self.is_trained:
            raise RuntimeError("Pipeline must be trained before saving")

        # Save model
        self.model_service.save_model(model_path)

        # Save scaler
        if self.scale_features and scaler_path:
            import joblib

            joblib.dump(self.scaler, scaler_path)

    @classmethod
    def load_pipeline(
        cls,
        model_path: str,
        scaler_path: Optional[str] = None,
        scale_features: bool = True,
    ) -> "MLPipeline":
        """Load pipeline from files.

        Args:
            model_path: Path to load model from
            scaler_path: Path to load scaler from (optional)
            scale_features: Whether to scale features (default: True)

        Returns:
            MLPipeline: New pipeline instance
        """
        # Load model
        model_service = ModelService.load_model(model_path)

        # Create pipeline instance
        pipeline = cls(
            model_type="",  # Not needed since we're loading an existing model
            scale_features=scale_features,
        )
        pipeline.model_service = model_service

        # Load scaler
        if scale_features and scaler_path:
            import joblib

            pipeline.scaler = joblib.load(scaler_path)

        pipeline.is_trained = True
        return pipeline
