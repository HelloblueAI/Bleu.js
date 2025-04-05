"""
Feature Analyzer for Advanced Decision Tree
Copyright (c) 2024, Bleu.js
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import matplotlib.pyplot as plt
import numpy as np
import ray
import seaborn as sns
import structlog
from scipy import stats
from sklearn.decomposition import PCA
from sklearn.feature_selection import f_classif, mutual_info_classif
from sklearn.preprocessing import StandardScaler
from tensorflow import keras


@dataclass
class FeatureAnalysisConfig:
    """Configuration for feature analysis."""

    methods: List[str] = None
    n_components: int = 10
    correlation_threshold: float = 0.8
    importance_threshold: float = 0.1
    enable_visualization: bool = True
    enable_distributed_computing: bool = True
    feature_metrics: List[str] = None


class FeatureAnalyzer:
    """
    Advanced feature analyzer that provides comprehensive feature analysis
    and selection capabilities.
    """

    def __init__(self, config: FeatureAnalysisConfig = FeatureAnalysisConfig()):
        self.config = config
        self.logger = structlog.get_logger()
        self.scaler = StandardScaler()
        self.pca = PCA(n_components=config.n_components)
        self.feature_importance = {}
        self.correlation_matrix = None
        self.feature_stats = {}

        if self.config.methods is None:
            self.config.methods = [
                "correlation",
                "mutual_info",
                "f_score",
                "pca",
                "autoencoder",
            ]

        if self.config.feature_metrics is None:
            self.config.feature_metrics = [
                "importance",
                "correlation",
                "variance",
                "skewness",
                "kurtosis",
            ]

        # Initialize Ray for distributed computing if enabled
        if config.enable_distributed_computing:
            if not ray.is_initialized():
                ray.init(ignore_reinit_error=True)

    async def initialize(self) -> None:
        """Initialize the feature analyzer and its components."""
        self.logger.info("initializing_feature_analyzer")

        try:
            if "autoencoder" in self.config.methods:
                await self._initialize_autoencoder()

            self.logger.info("feature_analyzer_initialized")

        except Exception as e:
            self.logger.error("initialization_failed", error=str(e))
            raise

    async def _initialize_autoencoder(self) -> None:
        """Initialize autoencoder for feature analysis."""
        input_dim = 100  # Will be updated during analysis

        # Encoder
        encoder = keras.Sequential(
            [
                keras.layers.Dense(64, activation="relu", input_shape=(input_dim,)),
                keras.layers.Dropout(0.2),
                keras.layers.Dense(32, activation="relu"),
                keras.layers.Dropout(0.2),
                keras.layers.Dense(16, activation="relu"),
            ]
        )

        # Decoder
        decoder = keras.Sequential(
            [
                keras.layers.Dense(32, activation="relu", input_shape=(16,)),
                keras.layers.Dropout(0.2),
                keras.layers.Dense(64, activation="relu"),
                keras.layers.Dropout(0.2),
                keras.layers.Dense(input_dim, activation="linear"),
            ]
        )

        # Autoencoder
        self.autoencoder = keras.Sequential([encoder, decoder])
        self.autoencoder.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001), loss="mse"
        )

    async def analyze(
        self, X: np.ndarray, y: Optional[np.ndarray] = None
    ) -> Dict[str, np.ndarray]:
        """
        Perform comprehensive feature analysis.
        """
        self.logger.info("analyzing_features", data_shape=X.shape)

        try:
            # Scale features
            X_scaled = self.scaler.fit_transform(X)

            # Calculate feature statistics
            self.feature_stats = await self._calculate_feature_stats(X_scaled)

            # Calculate feature importance if labels are provided
            if y is not None:
                self.feature_importance = await self._calculate_feature_importance(
                    X_scaled, y
                )

            # Calculate correlation matrix
            if "correlation" in self.config.methods:
                self.correlation_matrix = await self._calculate_correlation_matrix(
                    X_scaled
                )

            # Perform PCA analysis
            if "pca" in self.config.methods:
                pca_results = await self._perform_pca(X_scaled)
                self.feature_stats["pca"] = pca_results

            # Perform autoencoder analysis
            if "autoencoder" in self.config.methods:
                autoencoder_results = await self._analyze_with_autoencoder(X_scaled)
                self.feature_stats["autoencoder"] = autoencoder_results

            # Generate visualizations if enabled
            if self.config.enable_visualization:
                await self._generate_visualizations(X_scaled)

            self.logger.info("feature_analysis_completed")
            return self.feature_importance

        except Exception as e:
            self.logger.error("feature_analysis_failed", error=str(e))
            raise

    async def _calculate_feature_stats(self, X: np.ndarray) -> Dict:
        """Calculate basic feature statistics."""
        stats_dict = {}

        for metric in self.config.feature_metrics:
            if metric == "variance":
                stats_dict["variance"] = np.var(X, axis=0)
            elif metric == "skewness":
                stats_dict["skewness"] = stats.skew(X)
            elif metric == "kurtosis":
                stats_dict["kurtosis"] = stats.kurtosis(X)

        return stats_dict

    async def _calculate_feature_importance(
        self, X: np.ndarray, y: np.ndarray
    ) -> Dict[str, np.ndarray]:
        """Calculate feature importance using multiple methods."""
        importance_dict = {}

        if "mutual_info" in self.config.methods:
            importance_dict["mutual_info"] = mutual_info_classif(X, y)

        if "f_score" in self.config.methods:
            importance_dict["f_score"] = f_classif(X, y)[0]

        # Normalize importance scores
        for method, scores in importance_dict.items():
            importance_dict[method] = scores / np.sum(scores)

        return importance_dict

    async def _calculate_correlation_matrix(self, X: np.ndarray) -> np.ndarray:
        """Calculate feature correlation matrix."""
        return np.corrcoef(X.T)

    async def _perform_pca(self, X: np.ndarray) -> Dict:
        """Perform PCA analysis."""
        # Fit PCA
        pca_result = self.pca.fit_transform(X)

        # Calculate explained variance ratio
        explained_variance_ratio = self.pca.explained_variance_ratio_
        cumulative_variance_ratio = np.cumsum(explained_variance_ratio)

        return {
            "components": pca_result,
            "explained_variance_ratio": explained_variance_ratio,
            "cumulative_variance_ratio": cumulative_variance_ratio,
            "loadings": self.pca.components_,
        }

    async def _analyze_with_autoencoder(self, X: np.ndarray) -> Dict:
        """Analyze features using autoencoder."""
        # Update input dimension if needed
        if self.autoencoder.layers[0].input_shape[1] != X.shape[1]:
            await self._initialize_autoencoder()

        # Train autoencoder
        self.autoencoder.fit(
            X, X, epochs=50, batch_size=32, validation_split=0.2, verbose=0
        )

        # Get encoded features
        encoded_features = self.autoencoder.layers[0].predict(X)

        # Calculate reconstruction error
        reconstructed = self.autoencoder.predict(X)
        reconstruction_error = np.mean(np.square(X - reconstructed), axis=0)

        return {
            "encoded_features": encoded_features,
            "reconstruction_error": reconstruction_error,
        }

    async def _generate_visualizations(self, X: np.ndarray) -> None:
        """Generate feature analysis visualizations."""
        # Create output directory if it doesn't exist
        import os

        os.makedirs("feature_analysis", exist_ok=True)

        # Plot feature importance
        if self.feature_importance:
            plt.figure(figsize=(10, 6))
            for method, importance in self.feature_importance.items():
                plt.plot(importance, label=method)
            plt.title("Feature Importance")
            plt.xlabel("Feature Index")
            plt.ylabel("Importance Score")
            plt.legend()
            plt.savefig("feature_analysis/importance.png")
            plt.close()

        # Plot correlation matrix
        if self.correlation_matrix is not None:
            plt.figure(figsize=(10, 10))
            sns.heatmap(self.correlation_matrix, annot=True, cmap="coolwarm", center=0)
            plt.title("Feature Correlation Matrix")
            plt.savefig("feature_analysis/correlation.png")
            plt.close()

        # Plot PCA results
        if "pca" in self.feature_stats:
            plt.figure(figsize=(10, 6))
            plt.plot(self.feature_stats["pca"]["cumulative_variance_ratio"])
            plt.title("Cumulative Explained Variance Ratio")
            plt.xlabel("Number of Components")
            plt.ylabel("Cumulative Explained Variance")
            plt.savefig("feature_analysis/pca.png")
            plt.close()

    async def select_features(
        self, X: np.ndarray, threshold: Optional[float] = None
    ) -> Tuple[np.ndarray, List[int]]:
        """
        Select features based on importance scores.
        """
        if threshold is None:
            threshold = self.config.importance_threshold

        # Combine importance scores from different methods
        combined_importance = np.zeros(X.shape[1])
        for importance in self.feature_importance.values():
            combined_importance += importance
        combined_importance /= len(self.feature_importance)

        # Select features
        selected_indices = np.where(combined_importance > threshold)[0]
        selected_features = X[:, selected_indices]

        return selected_features, selected_indices.tolist()

    async def save_state(self, path: str) -> None:
        """Save the current state of the feature analyzer."""
        import joblib

        state = {
            "config": self.config,
            "scaler": self.scaler,
            "pca": self.pca,
            "autoencoder": self.autoencoder,
            "feature_importance": self.feature_importance,
            "correlation_matrix": self.correlation_matrix,
            "feature_stats": self.feature_stats,
        }

        joblib.dump(state, path)
        self.logger.info("feature_analyzer_state_saved", path=path)

    async def load_state(self, path: str) -> None:
        """Load a saved state of the feature analyzer."""
        import joblib

        state = joblib.load(path)
        self.config = state["config"]
        self.scaler = state["scaler"]
        self.pca = state["pca"]
        self.autoencoder = state["autoencoder"]
        self.feature_importance = state["feature_importance"]
        self.correlation_matrix = state["correlation_matrix"]
        self.feature_stats = state["feature_stats"]

        self.logger.info("feature_analyzer_state_loaded", path=path)
