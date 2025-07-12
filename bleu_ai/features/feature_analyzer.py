"""
Feature Analyzer Implementation
Provides advanced feature analysis capabilities for machine learning models.
"""

import logging
from typing import Any, Dict, List, Optional

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import shap
from scipy import stats
from scipy.stats import spearmanr
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_selection import mutual_info_classif, mutual_info_regression
from sklearn.preprocessing import PolynomialFeatures, StandardScaler

logger = logging.getLogger(__name__)


class FeatureAnalyzer:
    def __init__(
        self,
        method: str = "shap",
        n_features: Optional[int] = None,
        threshold: float = 0.01,
        n_estimators: int = 100,
    ):
        self.method = method
        self.n_features = n_features
        self.threshold = threshold
        self.n_estimators = n_estimators
        self.feature_importances = None
        self.feature_interactions = None
        self.selected_features = None
        self.scaler = StandardScaler()
        self.initialized = False

    async def initialize(self):
        """Initialize the feature analyzer."""
        try:
            self.initialized = True
            logging.info("✅ Feature analyzer initialized successfully")
        except Exception as e:
            logging.error(f"❌ Failed to initialize feature analyzer: {str(e)}")
            raise

    async def analyze(
        self, X: np.ndarray, y: np.ndarray, feature_names: Optional[List[str]] = None
    ) -> Dict:
        """Analyze features using various methods."""
        try:
            if not self.initialized:
                await self.initialize()

            if self.method is None:
                raise ValueError("Analysis method not initialized")

            # Scale features
            if self.scaler is None:
                self.scaler = StandardScaler()
            X_scaled = self.scaler.fit_transform(X)

            # Set feature names
            if feature_names is None:
                feature_names = [f"Feature {i}" for i in range(X.shape[1])]

            # Calculate feature importance
            importance = await self._calculate_importance(X_scaled, y)
            self.feature_importances = importance

            # Calculate feature interactions
            interactions = await self._calculate_interactions(X_scaled)
            self.feature_interactions = interactions

            # Select important features
            selected = await self._select_features(X_scaled, y)
            self.selected_features = selected

            # Create visualizations
            await self._create_visualizations(
                X_scaled, importance, interactions, feature_names
            )

            return {
                "feature_importances": importance,
                "feature_interactions": interactions,
                "selected_features": selected,
                "feature_names": feature_names,
            }

        except Exception as e:
            logging.error(f"❌ Feature analysis failed: {str(e)}")
            raise

    async def _calculate_importance(self, X: np.ndarray, y: np.ndarray) -> np.ndarray:
        """Calculate feature importance using specified method."""
        try:
            if self.method == "shap":
                # Use SHAP values
                model = RandomForestClassifier(
                    n_estimators=self.n_estimators, random_state=42
                )
                model.fit(X, y)
                explainer = shap.TreeExplainer(model)
                shap_values = explainer.shap_values(X)
                if isinstance(shap_values, list):
                    importance = np.abs(shap_values[0]).mean(0)
                else:
                    importance = np.abs(shap_values).mean(0)
            elif self.method == "mutual_info":
                # Use mutual information
                if len(np.unique(y)) > 2:
                    importance = mutual_info_classif(X, y)
                else:
                    importance = mutual_info_regression(X, y)
            elif self.method == "correlation":
                # Use correlation coefficients
                importance = np.array(
                    [abs(spearmanr(X[:, i], y)[0]) for i in range(X.shape[1])]
                )
            else:
                raise ValueError(f"Unsupported importance method: {self.method}")

            return importance

        except Exception as e:
            logging.error(f"❌ Feature importance calculation failed: {str(e)}")
            raise

    async def _calculate_interactions(self, X: np.ndarray) -> np.ndarray:
        """Calculate feature interactions."""
        try:
            # Calculate correlation matrix
            interactions = np.corrcoef(X.T)

            # Set diagonal to zero
            np.fill_diagonal(interactions, 0)

            return interactions

        except Exception as e:
            logging.error(f"❌ Feature interaction calculation failed: {str(e)}")
            raise

    async def _select_features(self, X: np.ndarray, y: np.ndarray) -> List[int]:
        """Select important features based on importance scores."""
        try:
            if self.feature_importances is None:
                raise ValueError("Feature importances not calculated")

            if self.n_features is not None:
                # Select top N features
                selected = np.argsort(self.feature_importances)[-self.n_features:]
            else:
                # Select features above threshold
                selected = np.where(self.feature_importances > self.threshold)[0]

            return selected.tolist()

        except Exception as e:
            logging.error(f"❌ Feature selection failed: {str(e)}")
            raise

    async def _create_visualizations(
        self,
        X: np.ndarray,
        importance: np.ndarray,
        interactions: np.ndarray,
        feature_names: List[str],
    ):
        """Create feature analysis visualizations."""
        try:
            # Feature importance plot
            plt.figure(figsize=(10, 6))
            importance_df = pd.DataFrame(
                {"Feature": feature_names, "Importance": importance}
            )
            importance_df = importance_df.sort_values("Importance", ascending=True)
            sns.barplot(data=importance_df, x="Importance", y="Feature")
            plt.title("Feature Importance")
            plt.tight_layout()
            plt.savefig("feature_importance.png")
            plt.close()

            # Feature interaction heatmap
            plt.figure(figsize=(12, 8))
            sns.heatmap(
                interactions,
                xticklabels=feature_names,
                yticklabels=feature_names,
                cmap="coolwarm",
                center=0,
                annot=True,
            )
            plt.title("Feature Interactions")
            plt.tight_layout()
            plt.savefig("feature_interactions.png")
            plt.close()

            # Selected features plot
            if self.selected_features is not None:
                plt.figure(figsize=(10, 6))
                selected_df = importance_df.iloc[self.selected_features]
                sns.barplot(data=selected_df, x="Importance", y="Feature")
                plt.title("Selected Features")
                plt.tight_layout()
                plt.savefig("selected_features.png")
                plt.close()

            logging.info("✅ Feature analysis visualizations created successfully")

        except Exception as e:
            logging.error(f"❌ Visualization creation failed: {str(e)}")
            raise

    def get_feature_importances(self) -> Optional[np.ndarray]:
        """Get calculated feature importances."""
        return self.feature_importances

    def get_feature_interactions(self) -> Optional[np.ndarray]:
        """Get calculated feature interactions."""
        return self.feature_interactions

    def get_selected_features(self) -> Optional[List[int]]:
        """Get indices of selected features."""
        return self.selected_features

    async def dispose(self):
        """Clean up resources."""
        try:
            self.feature_importances = None
            self.feature_interactions = None
            self.selected_features = None
            self.scaler = None
            self.initialized = False
            logging.info("✅ Feature analyzer resources cleaned up")
        except Exception as e:
            logging.error(f"❌ Failed to clean up feature analyzer: {str(e)}")
            raise

    def analyze_features(self, features: np.ndarray) -> Dict[str, Any]:
        """Analyze feature distributions and statistics."""
        try:
            if features is None or len(features) == 0:
                return {}

            # Scale features
            if self.scaler is None:
                logger.error("Scaler not initialized")
                return {}

            features_scaled = self.scaler.fit_transform(features)

            # Calculate statistics
            stats_dict = {
                "mean": np.mean(features_scaled, axis=0),
                "std": np.std(features_scaled, axis=0),
                "skew": stats.skew(features_scaled),
                "kurtosis": stats.kurtosis(features_scaled),
            }

            return stats_dict
        except Exception as e:
            logger.error(f"Feature analysis error: {e}")
            return {}

    def select_features(
        self, features: np.ndarray, threshold: float = 0.1
    ) -> List[int]:
        """Select features based on importance."""
        try:
            if features is None or len(features) == 0:
                return []

            # Calculate feature importance
            importance = self._calculate_importance(features)

            # Select features above threshold
            selected = np.where(importance > threshold)[0]

            return selected.tolist()
        except Exception as e:
            logger.error(f"Feature selection error: {e}")
            return []

    def transform_features(self, features: np.ndarray) -> np.ndarray:
        """Transform features using selected methods."""
        try:
            if features is None or len(features) == 0:
                return np.array([])

            # Apply transformations
            transformed = features.copy()

            # Add polynomial features if configured
            if self.config.use_polynomial:
                poly = PolynomialFeatures(degree=2)
                transformed = poly.fit_transform(transformed)

            # Add interaction features if configured
            if self.config.use_interactions:
                transformed = self._add_interaction_features(transformed)

            return transformed
        except Exception as e:
            logger.error(f"Feature transformation error: {e}")
            return np.array([])

    def _calculate_importance(self, features: np.ndarray) -> np.ndarray:
        """Calculate feature importance scores."""
        try:
            if features is None or len(features) == 0:
                return np.array([])

            # Use mutual information for feature importance
            importance = mutual_info_classif(features, np.zeros(len(features)))
            return importance
        except Exception as e:
            logger.error(f"Feature importance calculation error: {e}")
            return np.array([])
