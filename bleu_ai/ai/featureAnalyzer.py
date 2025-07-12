"""
Feature Analyzer Implementation
Provides advanced feature analysis capabilities for machine learning models.
"""

import logging
from typing import List, Optional

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import shap
from sklearn.feature_selection import mutual_info_classif, mutual_info_regression
from sklearn.preprocessing import StandardScaler


class FeatureAnalyzer:
    def __init__(
        self,
        method: str = "shap",
        n_features: Optional[int] = None,
        threshold: float = 0.01,
    ):
        self.method = method
        self.n_features = n_features
        self.threshold = threshold
        self.feature_importances = None
        self.feature_interactions = None
        self.scaler = StandardScaler()
        self.initialized = False

    def initialize(self):
        """Initialize the feature analyzer."""
        try:
            self.initialized = True
            logging.info("✅ Feature analyzer initialized successfully")
        except Exception as e:
            logging.error(f"❌ Failed to initialize feature analyzer: {str(e)}")
            raise

    def analyze_features(
        self,
        features: np.ndarray,
        targets: np.ndarray,
        feature_names: Optional[List[str]] = None,
    ) -> np.ndarray:
        """Analyze feature importance and interactions."""
        try:
            if not self.initialized:
                self.initialize()

            if self.method is None:
                raise ValueError("Analysis method not initialized")

            # Scale features
            if self.scaler is None:
                self.scaler = StandardScaler()
            features_scaled = self.scaler.fit_transform(features)

            # Calculate feature importance based on method
            if self.method == "shap":
                importance = self._analyze_shap(features_scaled, targets)
            elif self.method == "mutual_info":
                importance = self._analyze_mutual_info(features_scaled, targets)
            else:
                raise ValueError(f"Unsupported analysis method: {self.method}")

            # Store feature importances
            self.feature_importances = importance

            # Calculate feature interactions
            self.feature_interactions = self._calculate_interactions(features_scaled)

            # Select top features if n_features is specified
            if self.n_features is not None:
                importance = self._select_top_features(importance)

            # Create feature importance plot
            if feature_names is None:
                feature_names = [f"Feature {i}" for i in range(features.shape[1])]
            self._plot_feature_importance(importance, feature_names)

            return importance

        except Exception as e:
            logging.error(f"❌ Feature analysis failed: {str(e)}")
            raise

    def _analyze_shap(self, features: np.ndarray, targets: np.ndarray) -> np.ndarray:
        """Analyze feature importance using SHAP values."""
        try:
            # Create a simple model for SHAP analysis
            from sklearn.ensemble import RandomForestClassifier

            model = RandomForestClassifier(
                n_estimators=100,
                min_samples_leaf=1,
                max_features="sqrt",
                random_state=42,
            )
            model.fit(features, targets)

            # Calculate SHAP values
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(features)

            # Calculate mean absolute SHAP values
            if isinstance(shap_values, list):
                # For multi-class problems
                importance = np.mean(
                    [np.abs(sv).mean(axis=0) for sv in shap_values], axis=0
                )
            else:
                # For binary classification
                importance = np.abs(shap_values).mean(axis=0)

            return importance

        except Exception as e:
            logging.error(f"❌ SHAP analysis failed: {str(e)}")
            raise

    def _analyze_mutual_info(
        self, features: np.ndarray, targets: np.ndarray
    ) -> np.ndarray:
        """Analyze feature importance using mutual information."""
        try:
            # Calculate mutual information scores
            if len(np.unique(targets)) > 2:
                # For classification problems
                mi_scores = mutual_info_classif(features, targets, random_state=42)
            else:
                # For regression problems
                mi_scores = mutual_info_regression(features, targets, random_state=42)

            return mi_scores

        except Exception as e:
            logging.error(f"❌ Mutual information analysis failed: {str(e)}")
            raise

    def _calculate_interactions(self, features: np.ndarray) -> np.ndarray:
        """Calculate feature interactions using correlation matrix."""
        try:
            # Calculate correlation matrix
            corr_matrix = np.corrcoef(features.T)

            # Store interactions
            self.feature_interactions = corr_matrix

            return corr_matrix

        except Exception as e:
            logging.error(f"❌ Feature interaction calculation failed: {str(e)}")
            raise

    def _select_top_features(self, importance: np.ndarray) -> np.ndarray:
        """Select top features based on importance scores."""
        try:
            if self.n_features is None:
                return importance

            # Get indices of top features
            top_indices = np.argsort(importance)[-self.n_features :]

            # Create mask for top features
            mask = np.zeros_like(importance)
            mask[top_indices] = importance[top_indices]

            return mask

        except Exception as e:
            logging.error(f"❌ Feature selection failed: {str(e)}")
            raise

    def _plot_feature_importance(
        self, importance: np.ndarray, feature_names: List[str]
    ):
        """Plot feature importance scores."""
        try:
            # Create DataFrame for plotting
            df = pd.DataFrame({"Feature": feature_names, "Importance": importance})

            # Sort by importance
            df = df.sort_values("Importance", ascending=True)

            # Create plot
            plt.figure(figsize=(10, 6))
            sns.barplot(data=df, x="Importance", y="Feature")
            plt.title("Feature Importance")
            plt.tight_layout()

            # Save plot
            plt.savefig("feature_importance.png")
            plt.close()

            logging.info("✅ Feature importance plot saved")

        except Exception as e:
            logging.error(f"❌ Failed to create feature importance plot: {str(e)}")
            raise

    def dispose(self):
        """Clean up resources."""
        try:
            self.feature_importances = None
            self.feature_interactions = None
            self.scaler = None
            self.initialized = False
            logging.info("✅ Feature analyzer resources cleaned up")
        except Exception as e:
            logging.error(f"❌ Failed to clean up feature analyzer: {str(e)}")
            raise
