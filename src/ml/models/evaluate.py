"""Model evaluation module."""

from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from sklearn.base import BaseEstimator
from sklearn.model_selection import cross_val_score, train_test_split

from src.ml.metrics import PerformanceMetrics


class ModelEvaluator:
    """Class for evaluating machine learning models."""

    def __init__(
        self,
        model: BaseEstimator,
        X: np.ndarray,
        y: np.ndarray,
        test_size: float = 0.2,
        random_state: Optional[int] = None,
    ) -> None:
        """Initialize model evaluator.

        Args:
            model: Scikit-learn model
            X: Feature matrix
            y: Target vector
            test_size: Test set size (default: 0.2)
            random_state: Random state for reproducibility
        """
        self.model = model
        self.X = X
        self.y = y
        self.test_size = test_size
        self.random_state = random_state

        # Split data
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )

    def train_and_evaluate(self) -> Tuple[PerformanceMetrics, Dict[str, Any]]:
        """Train model and evaluate performance.

        Returns:
            Tuple[PerformanceMetrics, Dict[str, Any]]: Performance metrics and training info
        """
        # Train model
        self.model.fit(self.X_train, self.y_train)

        # Get predictions
        y_pred = self.model.predict(self.X_test)
        y_prob = (
            self.model.predict_proba(self.X_test)
            if hasattr(self.model, "predict_proba")
            else None
        )

        # Calculate metrics
        metrics = PerformanceMetrics(
            y_true=self.y_test,
            y_pred=y_pred,
            y_prob=y_prob,
        )

        # Get training info
        training_info = {
            "model_type": type(self.model).__name__,
            "n_samples": len(self.X),
            "n_features": self.X.shape[1],
            "test_size": self.test_size,
            "random_state": self.random_state,
        }

        return metrics, training_info

    def cross_validate(
        self, cv: int = 5, scoring: Optional[str] = None
    ) -> Dict[str, List[float]]:
        """Perform cross-validation.

        Args:
            cv: Number of folds (default: 5)
            scoring: Scoring metric (default: None)

        Returns:
            Dict[str, List[float]]: Cross-validation scores
        """
        # Perform cross-validation with single metric
        scores = cross_val_score(self.model, self.X, self.y, cv=cv, scoring=scoring)
        metric_name = scoring if scoring else "score"
        return {metric_name: scores.tolist()}

    def get_feature_importance(self) -> Optional[Dict[str, float]]:
        """Get feature importance scores.

        Returns:
            Optional[Dict[str, float]]: Feature importance scores
        """
        if not hasattr(self.model, "feature_importances_") and not hasattr(
            self.model, "coef_"
        ):
            return None

        # Get feature importance scores
        if hasattr(self.model, "feature_importances_"):
            importance = self.model.feature_importances_
        else:
            importance = np.abs(self.model.coef_[0])

        # Create feature importance dictionary
        feature_importance = {
            f"feature_{i}": float(score) for i, score in enumerate(importance)
        }

        return feature_importance

    def plot_learning_curve(
        self,
        cv: int = 5,
        scoring: str = "accuracy",
        n_jobs: int = -1,
        train_sizes: np.ndarray = np.linspace(0.1, 1.0, 5),
    ) -> None:
        """Plot learning curve.

        Args:
            cv: Number of folds (default: 5)
            scoring: Scoring metric (default: accuracy)
            n_jobs: Number of jobs to run in parallel (default: -1)
            train_sizes: Array of training set sizes to evaluate
        """
        import matplotlib.pyplot as plt
        from sklearn.model_selection import learning_curve

        # Calculate learning curve
        train_sizes, train_scores, test_scores = learning_curve(
            self.model,
            self.X,
            self.y,
            cv=cv,
            n_jobs=n_jobs,
            train_sizes=train_sizes,
            scoring=scoring,
        )

        # Calculate mean and std
        train_mean = np.mean(train_scores, axis=1)
        train_std = np.std(train_scores, axis=1)
        test_mean = np.mean(test_scores, axis=1)
        test_std = np.std(test_scores, axis=1)

        # Plot learning curve
        plt.figure(figsize=(10, 6))
        plt.plot(train_sizes, train_mean, label="Training score")
        plt.plot(train_sizes, test_mean, label="Cross-validation score")

        # Plot standard deviation bands
        plt.fill_between(
            train_sizes,
            train_mean - train_std,
            train_mean + train_std,
            alpha=0.1,
        )
        plt.fill_between(
            train_sizes,
            test_mean - test_std,
            test_mean + test_std,
            alpha=0.1,
        )

        plt.xlabel("Training Examples")
        plt.ylabel(f"Score ({scoring})")
        plt.title("Learning Curve")
        plt.legend(loc="best")
        plt.grid(True)
        plt.show()

    def save_model(self, filepath: str) -> None:
        """Save model to file.

        Args:
            filepath: Path to save model
        """
        import joblib

        joblib.dump(self.model, filepath)
