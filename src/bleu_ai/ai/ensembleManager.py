"""
Ensemble Manager Implementation
Provides advanced ensemble management capabilities for machine learning models.
"""

import logging
from typing import Dict, List, Optional, Tuple, Union

import catboost as cb
import lightgbm as lgb
import numpy as np
import xgboost as xgb
from sklearn.ensemble import (
    GradientBoostingClassifier,
    RandomForestClassifier,
    VotingClassifier,
)
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.model_selection import KFold


class EnsembleManager:
    def __init__(
        self,
        methods: List[str] = None,
        n_estimators: int = 100,
        n_folds: int = 5,
        voting: str = "soft",
    ):
        if methods is None:
            methods = ["rf", "gb", "xgb", "lgb", "catboost"]
        self.methods = methods
        self.n_estimators = n_estimators
        self.n_folds = n_folds
        self.voting = voting
        self.models = {}
        self.weights = {}
        self.initialized = False

    def initialize(self):
        """Initialize the ensemble manager."""
        try:
            self.initialized = True
            logging.info("✅ Ensemble manager initialized successfully")
        except Exception as e:
            logging.error(f"❌ Failed to initialize ensemble manager: {str(e)}")
            raise

    def _create_model(self, method: str):
        """Create a model based on the method."""
        if method == "rf":
            return RandomForestClassifier(
                n_estimators=self.n_estimators,
                n_jobs=-1,
                min_samples_leaf=1,
                max_features="sqrt",
                random_state=42,
            )
        elif method == "gb":
            return GradientBoostingClassifier(
                n_estimators=self.n_estimators,
                min_samples_leaf=1,
                max_features="sqrt",
                random_state=42,
            )
        elif method == "xgb":
            return xgb.XGBClassifier(
                n_estimators=self.n_estimators,
                min_child_weight=1,
                max_depth=6,
                random_state=42,
            )
        elif method == "lgb":
            return lgb.LGBMClassifier(
                n_estimators=self.n_estimators,
                min_child_samples=20,
                max_depth=6,
                random_state=42,
            )
        elif method == "catboost":
            return cb.CatBoostClassifier(
                iterations=self.n_estimators, verbose=False, random_state=42
            )
        else:
            raise ValueError(f"Unsupported model method: {method}")

    def _train_models_cv(self, features: np.ndarray, targets: np.ndarray):
        """Train models with cross-validation."""
        kf = KFold(n_splits=self.n_folds, shuffle=True, random_state=42)
        cv_scores = {method: [] for method in self.methods}

        for train_idx, val_idx in kf.split(features):
            train_features, val_features = features[train_idx], features[val_idx]
            train_targets, val_targets = targets[train_idx], targets[val_idx]

            for method, model in self.models.items():
                model.fit(train_features, train_targets)
                predictions = model.predict_proba(val_features)[:, 1]
                score = roc_auc_score(val_targets, predictions)
                cv_scores[method].append(score)

        return cv_scores

    def create_ensemble(
        self,
        features: np.ndarray,
        targets: np.ndarray,
        weights: Optional[Dict[str, float]] = None,
    ) -> None:
        """Create and train ensemble of models."""
        try:
            if not self.initialized:
                self.initialize()

            # Initialize models
            if self.models is None:
                self.models = {}
            for method in self.methods:
                self.models[method] = self._create_model(method)

            # Train models with cross-validation
            cv_scores = self._train_models_cv(features, targets)

            # Calculate average scores and weights
            avg_scores = {
                method: np.mean(scores) for method, scores in cv_scores.items()
            }

            # Normalize weights
            if weights is None:
                total_score = sum(avg_scores.values())
                self.weights = {
                    method: score / total_score for method, score in avg_scores.items()
                }
            else:
                self.weights = weights

            # Create voting classifier
            estimators = [(method, model) for method, model in self.models.items()]
            self.voting_clf = VotingClassifier(
                estimators=estimators,
                voting=self.voting,
                weights=list(self.weights.values()),
            )

            # Train voting classifier
            self.voting_clf.fit(features, targets)

            logging.info("✅ Ensemble created successfully")
            logging.info(f"Model weights: {self.weights}")

        except Exception as e:
            logging.error(f"❌ Ensemble creation failed: {str(e)}")
            raise

    def predict(
        self, features: np.ndarray, return_proba: bool = False
    ) -> Union[np.ndarray, Tuple[np.ndarray, np.ndarray]]:
        """Make predictions using the ensemble."""
        try:
            if not hasattr(self, "voting_clf") or self.voting_clf is None:
                raise ValueError("Ensemble not created. Call create_ensemble first.")

            if return_proba:
                predictions = self.voting_clf.predict_proba(features)
                return self.voting_clf.predict(features), predictions
            else:
                return self.voting_clf.predict(features)

        except Exception as e:
            logging.error(f"❌ Ensemble prediction failed: {str(e)}")
            raise

    def get_model_weights(self) -> Dict[str, float]:
        """Get current model weights."""
        if self.weights is None:
            return {}
        return self.weights

    def update_weights(self, weights: Dict[str, float]) -> None:
        """Update model weights."""
        try:
            # Validate weights
            if not all(0 <= w <= 1 for w in weights.values()):
                raise ValueError("Weights must be between 0 and 1")
            if abs(sum(weights.values()) - 1.0) > 1e-6:
                raise ValueError("Weights must sum to 1")

            # Update weights
            self.weights = weights

            # Update voting classifier
            if hasattr(self, "voting_clf") and self.voting_clf is not None:
                self.voting_clf.weights = list(weights.values())

            logging.info("✅ Model weights updated successfully")
            logging.info(f"New weights: {self.weights}")

        except Exception as e:
            logging.error(f"❌ Weight update failed: {str(e)}")
            raise

    def get_model_performance(
        self, features: np.ndarray, targets: np.ndarray
    ) -> Dict[str, float]:
        """Get performance metrics for each model."""
        try:
            performance = {}

            if self.models is None:
                return performance

            for method, model in self.models.items():
                # Get predictions
                predictions = model.predict(features)

                # Calculate metrics
                accuracy = accuracy_score(targets, predictions)
                auc = roc_auc_score(targets, model.predict_proba(features)[:, 1])

                performance[method] = {"accuracy": accuracy, "auc": auc}

            return performance

        except Exception as e:
            logging.error(f"❌ Performance calculation failed: {str(e)}")
            raise

    def dispose(self):
        """Clean up resources."""
        try:
            if self.models is not None:
                self.models.clear()
            if self.weights is not None:
                self.weights.clear()
            if hasattr(self, "voting_clf") and self.voting_clf is not None:
                del self.voting_clf
            self.initialized = False
            logging.info("✅ Ensemble manager resources cleaned up")
        except Exception as e:
            logging.error(f"❌ Cleanup failed: {str(e)}")
            raise
