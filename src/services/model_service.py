"""Model service module."""

from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
from sklearn.base import BaseEstimator

from src.ml.metrics import PerformanceMetrics
from src.ml.optimize import HyperparameterOptimizer


class ModelService:
    """Service for managing machine learning models."""

    def __init__(self, model: BaseEstimator) -> None:
        """Initialize model service.

        Args:
            model: Scikit-learn model
        """
        self.model = model
        self.is_trained = False
        self.optimizer: Optional[HyperparameterOptimizer] = None

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
        """Train model.

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
        if optimize and param_grid is not None:
            # Initialize optimizer
            self.optimizer = HyperparameterOptimizer(
                model=self.model,
                param_grid=param_grid,
                X=X,
                y=y,
                test_size=test_size,
                random_state=random_state,
            )

            # Perform optimization
            if optimization_method == "grid":
                best_model, results = self.optimizer.grid_search(**optimization_params)
            elif optimization_method == "random":
                best_model, results = self.optimizer.random_search(
                    **optimization_params
                )
            else:
                raise ValueError(
                    f"Invalid optimization method: {optimization_method}. "
                    "Must be 'grid' or 'random'."
                )

            # Update model with best estimator
            self.model = best_model
            training_info = results

        else:
            # Train model without optimization
            self.model.fit(X, y)
            training_info = {
                "model_type": type(self.model).__name__,
                "n_samples": len(X),
                "n_features": X.shape[1],
            }

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
            Union[np.ndarray, Tuple[np.ndarray, np.ndarray]]: Predictions
            and probabilities
        """
        if not self.is_trained:
            raise RuntimeError("Model must be trained before making predictions")

        # Make predictions
        y_pred = self.model.predict(X)

        if return_proba and hasattr(self.model, "predict_proba"):
            y_prob = self.model.predict_proba(X)
            return y_pred, y_prob
        return y_pred

    def evaluate(
        self,
        X: np.ndarray,
        y: np.ndarray,
        return_proba: bool = True,
    ) -> Tuple[PerformanceMetrics, Dict[str, Any]]:
        """Evaluate model performance.

        Args:
            X: Feature matrix
            y: Target vector
            return_proba: Whether to include probability scores in evaluation

        Returns:
            Tuple[PerformanceMetrics, Dict[str, Any]]: Performance metrics
            and evaluation info
        """
        if not self.is_trained:
            raise RuntimeError("Model must be trained before evaluation")

        # Make predictions
        if return_proba and hasattr(self.model, "predict_proba"):
            y_pred, y_prob = self.predict(X, return_proba=True)
        else:
            y_pred = self.predict(X, return_proba=False)
            y_prob = None

        # Calculate metrics
        metrics = PerformanceMetrics(y_true=y, y_pred=y_pred, y_prob=y_prob)

        # Get evaluation info
        evaluation_info = {
            "model_type": type(self.model).__name__,
            "n_samples": len(X),
            "n_features": X.shape[1],
        }

        return metrics, evaluation_info

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
        if self.optimizer is None:
            self.optimizer = HyperparameterOptimizer(
                model=self.model,
                param_grid={},  # Empty grid since we're not optimizing
                X=X,
                y=y,
            )

        return self.optimizer.cross_validate(self.model, cv=cv, scoring=scoring)

    def save_model(self, filepath: str) -> None:
        """Save model to file.

        Args:
            filepath: Path to save model
        """
        if not self.is_trained:
            raise RuntimeError("Model must be trained before saving")

        if self.optimizer is not None:
            self.optimizer.save_model(self.model, filepath)
        else:
            import joblib

            joblib.dump(self.model, filepath)

    @classmethod
    def load_model(cls, filepath: str) -> "ModelService":
        """Load model from file.

        Args:
            filepath: Path to load model from

        Returns:
            ModelService: New instance with loaded model
        """
        import joblib

        model = joblib.load(filepath)
        service = cls(model)
        service.is_trained = True
        return service
