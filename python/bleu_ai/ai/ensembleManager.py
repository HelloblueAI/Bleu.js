"""
Ensemble Manager Implementation
Provides advanced ensemble management capabilities for machine learning models.
"""

import logging
import numpy as np
from typing import Dict, List, Optional, Tuple, Union
from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    VotingClassifier,
)
from sklearn.model_selection import KFold
import xgboost as xgb
import lightgbm as lgb
import catboost as cb
from sklearn.metrics import accuracy_score, roc_auc_score


class EnsembleManager:
    def __init__(
        self,
        methods: List[str] = ["rf", "gb", "xgb", "lgb", "catboost"],
        n_estimators: int = 100,
        n_folds: int = 5,
        voting: str = "soft",
    ):
        self.methods = methods
        self.n_estimators = n_estimators
        self.n_folds = n_folds
        self.voting = voting
        self.models = {}
        self.weights = {}
        self.initialized = False

    async def initialize(self):
        """Initialize the ensemble manager."""
        try:
            self.initialized = True
            logging.info("✅ Ensemble manager initialized successfully")
        except Exception as e:
            logging.error(f"❌ Failed to initialize ensemble manager: {str(e)}")
            raise

    async def createEnsemble(
        self, X: np.ndarray, y: np.ndarray, weights: Optional[Dict[str, float]] = None
    ) -> None:
        """Create and train ensemble of models."""
        try:
            if not self.initialized:
                await self.initialize()

            # Initialize models based on methods
            if self.models is None:
                self.models = {}
            for method in self.methods:
                if method == "rf":
                    self.models[method] = RandomForestClassifier(
                        n_estimators=self.n_estimators, n_jobs=-1
                    )
                elif method == "gb":
                    self.models[method] = GradientBoostingClassifier(
                        n_estimators=self.n_estimators
                    )
                elif method == "xgb":
                    self.models[method] = xgb.XGBClassifier(
                        n_estimators=self.n_estimators
                    )
                elif method == "lgb":
                    self.models[method] = lgb.LGBMClassifier(
                        n_estimators=self.n_estimators
                    )
                elif method == "catboost":
                    self.models[method] = cb.CatBoostClassifier(
                        iterations=self.n_estimators, verbose=False
                    )
                else:
                    raise ValueError(f"Unsupported model method: {method}")

            # Train models with cross-validation
            kf = KFold(n_splits=self.n_folds, shuffle=True, random_state=42)
            cv_scores = {method: [] for method in self.methods}

            for train_idx, val_idx in kf.split(X):
                X_train, X_val = X[train_idx], X[val_idx]
                y_train, y_val = y[train_idx], y[val_idx]

                for method, model in self.models.items():
                    # Train model
                    model.fit(X_train, y_train)

                    # Get predictions
                    y_pred = model.predict_proba(X_val)[:, 1]

                    # Calculate score
                    score = roc_auc_score(y_val, y_pred)
                    cv_scores[method].append(score)

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
            self.voting_clf.fit(X, y)

            logging.info("✅ Ensemble created successfully")
            logging.info(f"Model weights: {self.weights}")

        except Exception as e:
            logging.error(f"❌ Ensemble creation failed: {str(e)}")
            raise

    async def predict(
        self, X: np.ndarray, return_proba: bool = False
    ) -> Union[np.ndarray, Tuple[np.ndarray, np.ndarray]]:
        """Make predictions using the ensemble."""
        try:
            if not hasattr(self, "voting_clf") or self.voting_clf is None:
                raise ValueError("Ensemble not created. Call createEnsemble first.")

            # Get predictions
            if return_proba:
                predictions = self.voting_clf.predict_proba(X)
                return self.voting_clf.predict(X), predictions
            else:
                return self.voting_clf.predict(X)

        except Exception as e:
            logging.error(f"❌ Ensemble prediction failed: {str(e)}")
            raise

    async def getModelWeights(self) -> Dict[str, float]:
        """Get current model weights."""
        if self.weights is None:
            return {}
        return self.weights

    async def updateWeights(self, weights: Dict[str, float]) -> None:
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

    async def getModelPerformance(
        self, X: np.ndarray, y: np.ndarray
    ) -> Dict[str, float]:
        """Get performance metrics for each model."""
        try:
            performance = {}

            if self.models is None:
                return performance

            for method, model in self.models.items():
                # Get predictions
                y_pred = model.predict(X)

                # Calculate metrics
                accuracy = accuracy_score(y, y_pred)
                auc = roc_auc_score(y, model.predict_proba(X)[:, 1])

                performance[method] = {"accuracy": accuracy, "auc": auc}

            return performance

        except Exception as e:
            logging.error(f"❌ Performance calculation failed: {str(e)}")
            raise

    async def dispose(self):
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
            logging.error(f"❌ Failed to clean up ensemble manager: {str(e)}")
            raise
