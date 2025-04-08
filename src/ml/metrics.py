"""Performance metrics module."""

from typing import Dict, List, Optional

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)


class PerformanceMetrics:
    """Class for calculating and storing performance metrics."""

    def __init__(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_prob: Optional[np.ndarray] = None,
    ) -> None:
        """Initialize performance metrics.

        Args:
            y_true: True labels
            y_pred: Predicted labels
            y_prob: Predicted probabilities (optional)
        """
        self.y_true = y_true
        self.y_pred = y_pred
        self.y_prob = y_prob

        # Calculate metrics
        self._calculate_metrics()

    def _calculate_metrics(self) -> None:
        """Calculate performance metrics."""
        # Basic metrics
        self.accuracy = accuracy_score(self.y_true, self.y_pred)
        self.precision = precision_score(self.y_true, self.y_pred, average="weighted")
        self.recall = recall_score(self.y_true, self.y_pred, average="weighted")
        self.f1 = f1_score(self.y_true, self.y_pred, average="weighted")

        # Confusion matrix
        self.confusion_matrix = confusion_matrix(self.y_true, self.y_pred)

        # ROC AUC (if probabilities are available)
        if self.y_prob is not None:
            if self.y_prob.shape[1] == 2:  # Binary classification
                self.roc_auc = roc_auc_score(self.y_true, self.y_prob[:, 1])
            else:  # Multi-class
                self.roc_auc = roc_auc_score(
                    self.y_true,
                    self.y_prob,
                    multi_class="ovr",
                    average="weighted",
                )
        else:
            self.roc_auc = None

    def get_metrics(self) -> Dict[str, float]:
        """Get all metrics as a dictionary.

        Returns:
            Dict[str, float]: Dictionary of metrics
        """
        metrics = {
            "accuracy": self.accuracy,
            "precision": self.precision,
            "recall": self.recall,
            "f1": self.f1,
        }

        if self.roc_auc is not None:
            metrics["roc_auc"] = self.roc_auc

        return metrics

    def get_confusion_matrix(self) -> np.ndarray:
        """Get confusion matrix.

        Returns:
            np.ndarray: Confusion matrix
        """
        return self.confusion_matrix

    def print_metrics(self) -> None:
        """Print all metrics."""
        metrics = self.get_metrics()
        print("\nPerformance Metrics:")
        print("-" * 20)
        for metric, value in metrics.items():
            print(f"{metric.upper()}: {value:.4f}")

    def print_confusion_matrix(self) -> None:
        """Print confusion matrix."""
        print("\nConfusion Matrix:")
        print("-" * 20)
        print(self.confusion_matrix)

    def to_dict(self) -> Dict[str, Dict[str, float]]:
        """Convert metrics to dictionary format.

        Returns:
            Dict[str, Dict[str, float]]: Dictionary of metrics
        """
        return {
            "metrics": self.get_metrics(),
            "confusion_matrix": self.confusion_matrix.tolist(),
        }

    @classmethod
    def from_predictions(
        cls,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_prob: Optional[np.ndarray] = None,
    ) -> "PerformanceMetrics":
        """Create PerformanceMetrics instance from predictions.

        Args:
            y_true: True labels
            y_pred: Predicted labels
            y_prob: Predicted probabilities (optional)

        Returns:
            PerformanceMetrics: New instance
        """
        return cls(y_true=y_true, y_pred=y_pred, y_prob=y_prob)
