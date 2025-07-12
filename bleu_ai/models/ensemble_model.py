"""
Ensemble Model Implementation
Combines multiple models for improved predictions.
"""

import logging
from typing import Dict, List, Optional, Tuple, Union

import numpy as np
from sklearn.base import BaseEstimator


class EnsembleModel:
    def __init__(
        self,
        models: Optional[List[BaseEstimator]] = None,
        weights: Optional[List[float]] = None,
    ):
        self.models = models or []
        self.weights = weights or []
        self.metrics = {}

    def add_model(self, model: BaseEstimator, weight: float = 1.0):
        """Add a model to the ensemble."""
        self.models.append(model)
        self.weights.append(weight)
        # Normalize weights
        self.weights = [w / sum(self.weights) for w in self.weights]

    def predict(
        self, features: np.ndarray, return_proba: bool = False
    ) -> Union[np.ndarray, Tuple[np.ndarray, np.ndarray]]:
        """Make predictions using the ensemble of models."""
        try:
            predictions = []
            probabilities = []

            for model in self.models:
                if return_proba:
                    pred, proba = model.predict(features, return_proba=True)
                    predictions.append(pred)
                    probabilities.append(proba)
                else:
                    predictions.append(model.predict(features))

            # Weighted voting for classification
            if return_proba:
                weighted_proba = np.zeros_like(probabilities[0])
                for proba, weight in zip(probabilities, self.weights):
                    weighted_proba += proba * weight
                final_pred = np.argmax(weighted_proba, axis=1)
                return final_pred, weighted_proba
            else:
                weighted_pred = np.zeros_like(predictions[0])
                for pred, weight in zip(predictions, self.weights):
                    weighted_pred += pred * weight
                return np.round(weighted_pred).astype(int)

        except Exception as e:
            logging.error(f"❌ Ensemble prediction failed: {str(e)}")
            raise

    def get_metrics(self) -> Dict:
        """Get ensemble model performance metrics."""
        return self.metrics

    def set_weights(self, weights: List[float]):
        """Set custom weights for the ensemble models."""
        if len(weights) != len(self.models):
            raise ValueError("Number of weights must match number of models")
        self.weights = [w / sum(weights) for w in weights]  # Normalize weights
