"""Model training module."""

from typing import Any, Dict, Optional, Tuple

import numpy as np
from sklearn.base import BaseEstimator
from sklearn.model_selection import GridSearchCV, train_test_split

from src.ml.metrics import PerformanceMetrics


class ModelTrainer:
    """Class for training machine learning models."""

    def __init__(
        self,
        model: BaseEstimator,
        features: np.ndarray,
        targets: np.ndarray,
        test_size: float = 0.2,
        random_state: Optional[int] = None,
    ) -> None:
        """Initialize model trainer.

        Args:
            model: Scikit-learn model
            X: Feature matrix
            y: Target vector
            test_size: Test set size (default: 0.2)
            random_state: Random state for reproducibility
        """
        self.model = model
        self.features = features
        self.targets = targets
        self.test_size = test_size
        self.random_state = random_state

        # Split data
        (
            self.features_train,
            self.features_test,
            self.targets_train,
            self.targets_test,
        ) = train_test_split(
            features, targets, test_size=test_size, random_state=random_state
        )

    def train(self) -> Tuple[PerformanceMetrics, Dict[str, Any]]:
        """Train model and evaluate performance.

        Returns:
            Tuple[PerformanceMetrics, Dict[str, Any]]: Performance metrics
            and training info
        """
        # Train model
        self.model.fit(self.features_train, self.targets_train)

        # Get predictions
        targets_pred = self.model.predict(self.features_test)
        targets_prob = (
            self.model.predict_proba(self.features_test)
            if hasattr(self.model, "predict_proba")
            else None
        )

        # Calculate metrics
        metrics = PerformanceMetrics(
            y_true=self.targets_test,
            y_pred=targets_pred,
            y_prob=targets_prob,
        )

        # Get training info
        training_info = {
            "model_type": type(self.model).__name__,
            "n_samples": len(self.features),
            "n_features": self.features.shape[1],
            "test_size": self.test_size,
            "random_state": self.random_state,
        }

        return metrics, training_info

    def grid_search(
        self,
        param_grid: Dict[str, Any],
        cv: int = 5,
        scoring: Optional[str] = None,
        n_jobs: int = -1,
    ) -> Dict[str, Any]:
        """Perform grid search for hyperparameter tuning.

        Args:
            param_grid: Parameter grid to search
            cv: Number of folds (default: 5)
            scoring: Scoring metric (default: None)
            n_jobs: Number of jobs to run in parallel (default: -1)

        Returns:
            Dict[str, Any]: Grid search results
        """
        # Create grid search object
        grid_search = GridSearchCV(
            self.model,
            param_grid,
            cv=cv,
            scoring=scoring,
            n_jobs=n_jobs,
            return_train_score=True,
        )

        # Fit grid search
        grid_search.fit(self.features_train, self.targets_train)

        # Get results
        results = {
            "best_params": grid_search.best_params_,
            "best_score": grid_search.best_score_,
            "cv_results": grid_search.cv_results_,
        }

        # Update model with best parameters
        self.model = grid_search.best_estimator_

        return results

    def save_model(self, filepath: str) -> None:
        """Save model to file.

        Args:
            filepath: Path to save model
        """
        import joblib

        joblib.dump(self.model, filepath)

    @classmethod
    def load_model(cls, filepath: str) -> BaseEstimator:
        """Load model from file.

        Args:
            filepath: Path to load model from

        Returns:
            BaseEstimator: Loaded model
        """
        import joblib

        return joblib.load(filepath)
