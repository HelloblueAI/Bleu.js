"""
Feature Analyzer Implementation
Provides advanced feature analysis and selection capabilities.
"""

import logging
from typing import Any, Dict, List, Optional

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import shap
from scipy import stats
from sklearn.feature_selection import mutual_info_classif
from sklearn.inspection import permutation_importance
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

    def initialize(self):
        """Initialize the feature analyzer."""
        try:
            self.scaler = StandardScaler()
            self.initialized = True
            logging.info("✅ Feature analyzer initialized successfully")
        except Exception as e:
            logging.error(f"❌ Failed to initialize feature analyzer: {str(e)}")
            raise

    def analyze(
        self,
        features: np.ndarray,
        targets: np.ndarray,
        feature_names: Optional[List[str]] = None,
    ) -> Dict:
        """Analyze features and calculate importance scores."""
        try:
            if not self.initialized:
                self.initialize()

            if features is None or len(features) == 0:
                return {}

            # Scale features
            if self.scaler is None:
                logger.error("Scaler not initialized")
                return {}

            features_scaled = self.scaler.fit_transform(features)

            # Calculate feature importance
            importance = self._calculate_importance(features_scaled, targets)

            # Calculate feature interactions
            interactions = self._calculate_interactions(features_scaled)

            # Select features
            selected = self._select_features(features_scaled, targets)

            # Store results
            self.feature_importances = importance
            self.feature_interactions = interactions
            self.selected_features = selected

            # Create visualizations
            if feature_names is None:
                feature_names = [f"Feature_{i}" for i in range(features.shape[1])]

            self._create_visualizations(
                features_scaled, importance, interactions, feature_names
            )

            return {
                "importance": importance,
                "interactions": interactions,
                "selected_features": selected,
                "feature_names": feature_names,
            }

        except Exception as e:
            logging.error(f"❌ Feature analysis failed: {str(e)}")
            raise

    def _calculate_importance(
        self, features: np.ndarray, targets: np.ndarray
    ) -> np.ndarray:
        """Calculate feature importance scores."""
        try:
            if self.method == "shap":
                # Use SHAP for feature importance
                explainer = shap.TreeExplainer(self.model)
                shap_values = explainer.shap_values(features)
                importance = np.abs(shap_values).mean(axis=0)
            elif self.method == "permutation":
                # Use permutation importance
                importance = permutation_importance(
                    self.model, features, targets, n_repeats=10, random_state=42
                ).importances_mean
            elif self.method == "mutual_info":
                # Use mutual information
                importance = mutual_info_classif(features, targets, random_state=42)
            else:
                raise ValueError(f"Unsupported importance method: {self.method}")

            return importance

        except Exception as e:
            logging.error(f"❌ Feature importance calculation failed: {str(e)}")
            raise

    def _calculate_interactions(self, features: np.ndarray) -> np.ndarray:
        """Calculate feature interactions."""
        try:
            # Calculate correlation matrix
            interactions = np.corrcoef(features.T)

            # Set diagonal to zero
            np.fill_diagonal(interactions, 0)

            return interactions

        except Exception as e:
            logging.error(f"❌ Feature interaction calculation failed: {str(e)}")
            raise

    def _select_features(self, features: np.ndarray, targets: np.ndarray) -> List[int]:
        """Select important features based on importance scores."""
        try:
            if self.feature_importances is None:
                raise ValueError("Feature importances not calculated")

            if self.n_features is not None:
                # Select top N features
                selected = np.argsort(self.feature_importances)[-self.n_features :]
            else:
                # Select features above threshold
                selected = np.nonzero(self.feature_importances > self.threshold)[0]

            return selected.tolist()

        except Exception as e:
            logging.error(f"❌ Feature selection failed: {str(e)}")
            raise

    def _create_visualizations(
        self,
        features: np.ndarray,
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

    def dispose(self):
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
            importance = self._calculate_importance_sync(features)

            # Select features above threshold
            selected = np.nonzero(importance > threshold)[0]

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
                poly = PolynomialFeatures(degree=2, interaction_only=False)
                transformed = poly.fit_transform(transformed)

            # Add interaction features if configured
            if self.config.use_interactions:
                transformed = self._add_interaction_features(transformed)

            return transformed
        except Exception as e:
            logger.error(f"Feature transformation error: {e}")
            return np.array([])

    def _calculate_importance_sync(self, features: np.ndarray) -> np.ndarray:
        """Calculate feature importance scores."""
        try:
            if features is None or len(features) == 0:
                return np.array([])

            # Use mutual information for feature importance
            importance = mutual_info_classif(
                features, np.zeros(len(features)), random_state=42
            )
            return importance
        except Exception as e:
            logger.error(f"Feature importance calculation error: {e}")
            return np.array([])
