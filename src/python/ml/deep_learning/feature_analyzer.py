"""
Feature Analyzer for Advanced Decision Tree
Copyright (c) 2024, Bleu.js
"""

import os
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import matplotlib.pyplot as plt
import msgpack
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

    methods: Optional[List[str]] = None
    n_components: int = 10
    correlation_threshold: float = 0.8
    importance_threshold: float = 0.1
    enable_visualization: bool = True
    enable_distributed_computing: bool = True
    feature_metrics: Optional[List[str]] = None


class FeatureAnalyzer:
    """
    Advanced feature analyzer that provides comprehensive feature analysis
    and selection capabilities.
    """

    def __init__(self, config: FeatureAnalysisConfig = FeatureAnalysisConfig()):
        self.config = config
        self.logger = structlog.get_logger()
        self.scaler: StandardScaler = StandardScaler()
        self.pca: PCA = PCA(n_components=config.n_components)
        self.feature_importance: Dict = {}
        self.correlation_matrix: Optional[np.ndarray] = None
        self.feature_stats: Dict = {}

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
        if config.enable_distributed_computing and not ray.is_initialized():
            ray.init(ignore_reinit_error=True)

        self._initialize_transformers()

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
        self, features: np.ndarray, y: Optional[np.ndarray] = None
    ) -> Dict[str, np.ndarray]:
        """
        Perform comprehensive feature analysis.
        """
        self.logger.info("analyzing_features", data_shape=features.shape)

        try:
            # Scale features
            x_scaled = self.scaler.transform(features)

            # Calculate feature statistics
            self.feature_stats = await self._calculate_feature_stats(x_scaled)

            # Calculate feature importance if labels are provided
            if y is not None:
                self.feature_importance = await self._calculate_feature_importance(
                    x_scaled, y
                )

            # Calculate correlation matrix
            if "correlation" in self.config.methods:
                self.correlation_matrix = await self._calculate_correlation_matrix(
                    x_scaled
                )

            # Perform PCA analysis
            if "pca" in self.config.methods:
                pca_results = await self._perform_pca(x_scaled)
                self.feature_stats["pca"] = pca_results

            # Perform autoencoder analysis
            if "autoencoder" in self.config.methods:
                autoencoder_results = await self._analyze_with_autoencoder()
                self.feature_stats["autoencoder"] = autoencoder_results

            # Generate visualizations if enabled
            if self.config.enable_visualization:
                await self._generate_visualizations()

            self.logger.info("feature_analysis_completed")
            return self.feature_importance

        except Exception as e:
            self.logger.error("feature_analysis_failed", error=str(e))
            raise

    async def _calculate_feature_stats(self, features: np.ndarray) -> Dict:
        """Calculate basic feature statistics."""
        stats_dict = {}

        if self.config.feature_metrics is None:
            return stats_dict

        for metric in self.config.feature_metrics:
            if metric == "variance":
                stats_dict["variance"] = np.var(features, axis=0)
            elif metric == "skewness":
                stats_dict["skewness"] = stats.skew(features)
            elif metric == "kurtosis":
                stats_dict["kurtosis"] = stats.kurtosis(features)

        return stats_dict

    async def _calculate_feature_importance(
        self, features: np.ndarray, y: np.ndarray
    ) -> Dict[str, np.ndarray]:
        """Calculate feature importance using multiple methods."""
        importance_dict = {}

        if "mutual_info" in self.config.methods:
            importance_dict["mutual_info"] = mutual_info_classif(features, y)

        if "f_score" in self.config.methods:
            importance_dict["f_score"] = f_classif(features, y)[0]

        # Normalize importance scores
        for method, scores in importance_dict.items():
            importance_dict[method] = scores / np.sum(scores)

        return importance_dict

    async def _calculate_correlation_matrix(self, features: np.ndarray) -> np.ndarray:
        """Calculate feature correlation matrix."""
        return np.corrcoef(features.T)

    async def _perform_pca(self, features: np.ndarray) -> Dict:
        """Perform PCA analysis."""
        # Fit PCA
        pca_result = self.pca.fit_transform(features)

        # Calculate explained variance ratio
        explained_variance_ratio = self.pca.explained_variance_ratio_
        cumulative_variance_ratio = np.cumsum(explained_variance_ratio)

        return {
            "components": pca_result,
            "explained_variance_ratio": explained_variance_ratio,
            "cumulative_variance_ratio": cumulative_variance_ratio,
            "loadings": self.pca.components_,
        }

    async def _analyze_with_autoencoder(self) -> Dict:
        """Analyze features using autoencoder."""
        # Update input dimension if needed
        if self.autoencoder.layers[0].input_shape[1] != self.features.shape[1]:
            await self._initialize_autoencoder()

        # Train autoencoder
        self.autoencoder.fit(
            self.features,
            self.features,
            epochs=50,
            batch_size=32,
            validation_split=0.2,
            verbose=0,
        )

        # Get encoded features
        encoded_features = self.autoencoder.layers[0].predict(self.features)

        # Calculate reconstruction error
        reconstructed = self.autoencoder.predict(self.features)
        reconstruction_error = np.mean(np.square(self.features - reconstructed), axis=0)

        return {
            "encoded_features": encoded_features,
            "reconstruction_error": reconstruction_error,
        }

    async def _generate_visualizations(self) -> None:
        """Generate feature analysis visualizations."""
        # Create output directory if it doesn't exist
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
        self, features: np.ndarray, threshold: Optional[float] = None
    ) -> Tuple[np.ndarray, List[int]]:
        """
        Select features based on importance scores.
        """
        if threshold is None:
            threshold = self.config.importance_threshold

        # Combine importance scores from different methods
        combined_importance = np.zeros(features.shape[1])
        for importance in self.feature_importance.values():
            combined_importance += importance
        combined_importance /= len(self.feature_importance)

        # Select features
        selected_indices = np.nonzero(combined_importance > threshold)[0]
        selected_features = features[:, selected_indices]

        return selected_features, selected_indices.tolist()

    def _get_scaler_state(self) -> Optional[Dict]:
        """Get the state of the scaler."""
        if not self.scaler:
            return None
        return {
            "scale_": (
                self.scaler.scale_.tobytes() if self.scaler.scale_ is not None else None
            ),
            "mean_": (
                self.scaler.mean_.tobytes() if self.scaler.mean_ is not None else None
            ),
            "var_": (
                self.scaler.var_.tobytes() if self.scaler.var_ is not None else None
            ),
            "n_samples_seen_": self.scaler.n_samples_seen_,
        }

    def _get_pca_state(self) -> Optional[Dict]:
        """Get the state of the PCA."""
        if not self.pca:
            return None
        return {
            "components_": (
                self.pca.components_.tobytes()
                if self.pca.components_ is not None
                else None
            ),
            "explained_variance_": (
                self.pca.explained_variance_.tobytes()
                if self.pca.explained_variance_ is not None
                else None
            ),
            "explained_variance_ratio_": (
                self.pca.explained_variance_ratio_.tobytes()
                if self.pca.explained_variance_ratio_ is not None
                else None
            ),
            "singular_values_": (
                self.pca.singular_values_.tobytes()
                if self.pca.singular_values_ is not None
                else None
            ),
            "mean_": self.pca.mean_.tobytes() if self.pca.mean_ is not None else None,
            "n_components_": self.pca.n_components_,
        }

    def _get_config_state(self) -> Dict:
        """Get the state of the config."""
        return self.config.dict() if hasattr(self.config, "dict") else self.config

    def _get_feature_importance_state(self) -> Dict:
        """Get the state of feature importance."""
        return (
            {
                name: importance.tobytes()
                for name, importance in self.feature_importance.items()
            }
            if self.feature_importance
            else {}
        )

    async def save_state(self, path: str) -> None:
        """Save the current state of the feature analyzer."""
        state = {
            "config": self._get_config_state(),
            "scaler": self._get_scaler_state(),
            "pca": self._get_pca_state(),
            "autoencoder": self.autoencoder.state_dict() if self.autoencoder else None,
            "feature_importance": self._get_feature_importance_state(),
            "correlation_matrix": (
                self.correlation_matrix.tobytes()
                if self.correlation_matrix is not None
                else None
            ),
            "feature_stats": self.feature_stats,
        }

        # Save as msgpack for efficient binary serialization
        with open(path, "wb") as f:
            f.write(msgpack.packb(state))
        self.logger.info("feature_analyzer_state_saved", path=path)

    async def load_state(self, path: str) -> None:
        """Load a saved state of the feature analyzer."""
        with open(path, "rb") as f:
            state = msgpack.unpackb(f.read())

        self.config = state["config"]

        if state["scaler"]:
            from sklearn.preprocessing import StandardScaler

            self.scaler = StandardScaler()
            self.scaler.scale_ = np.frombuffer(state["scaler"]["scale_"])
            self.scaler.mean_ = np.frombuffer(state["scaler"]["mean_"])
            self.scaler.var_ = np.frombuffer(state["scaler"]["var_"])
            self.scaler.n_samples_seen_ = state["scaler"]["n_samples_seen_"]
        else:
            self.scaler = None

        if state["pca"]:
            from sklearn.decomposition import PCA

            self.pca = PCA()
            self.pca.components_ = np.frombuffer(state["pca"]["components_"])
            self.pca.explained_variance_ = np.frombuffer(
                state["pca"]["explained_variance_"]
            )
            self.pca.explained_variance_ratio_ = np.frombuffer(
                state["pca"]["explained_variance_ratio_"]
            )
            self.pca.singular_values_ = np.frombuffer(state["pca"]["singular_values_"])
            self.pca.mean_ = np.frombuffer(state["pca"]["mean_"])
            self.pca.n_components_ = state["pca"]["n_components_"]
        else:
            self.pca = None

        self.autoencoder = state["autoencoder"]

        self.feature_importance = (
            {
                name: np.frombuffer(importance)
                for name, importance in state["feature_importance"].items()
            }
            if state["feature_importance"]
            else {}
        )

        self.correlation_matrix = (
            np.frombuffer(state["correlation_matrix"])
            if state["correlation_matrix"] is not None
            else None
        )

        self.feature_stats = state["feature_stats"]

        self.logger.info("feature_analyzer_state_loaded", path=path)

    def _initialize_transformers(self) -> None:
        """Initialize the scaler and PCA objects."""
        if not isinstance(self.scaler, StandardScaler):
            self.scaler = StandardScaler()
        if not isinstance(self.pca, PCA):
            self.pca = PCA(n_components=self.config.n_components)

    def transform_features(self, features: np.ndarray) -> np.ndarray:
        """Transform features using scaler and PCA."""
        if not isinstance(features, np.ndarray):
            features = np.array(features)

        if self.scaler is None or self.pca is None:
            self._initialize_transformers()

        scaled_features = self.scaler.fit_transform(features)
        return self.pca.fit_transform(scaled_features)

    def get_feature_importance(self):
        """Get feature importance based on PCA components."""
        if self.pca is None or not hasattr(self.pca, "components_"):
            self._initialize_transformers()
            raise ValueError(
                "PCA has not been fitted yet. Transform some features first."
            )

        importance = np.abs(self.pca.components_)
        explained_var = self.pca.explained_variance_ratio_

        return {"importance": importance, "explained_variance": explained_var}
