"""Quantum-enhanced ML benchmarking and case studies."""

import logging
import time
from dataclasses import dataclass
from typing import Dict, List, Optional, Union

import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.metrics import accuracy_score, r2_score
from sklearn.model_selection import train_test_split

from src.python.ml.xgboost.bleu_xgboost import BleuXGBoost
from src.quantum_py.optimization.contest_strategy import BleuQuantumContestOptimizer

logger = logging.getLogger(__name__)


@dataclass
class BenchmarkResult:
    """Results from a single benchmark run."""

    model_name: str
    dataset_name: str
    metric_name: str
    metric_value: float
    training_time: float
    inference_time: float
    quantum_advantage: Optional[float] = None
    parameters: Optional[Dict] = None


class QuantumBenchmark:
    """Benchmarking suite for quantum-enhanced ML models."""

    def __init__(
        self,
        quantum_optimizer: Optional[BleuQuantumContestOptimizer] = None,
        classical_model: Optional[BleuXGBoost] = None,
    ):
        """Initialize the benchmarking suite.

        Args:
            quantum_optimizer: Optional quantum optimizer instance
            classical_model: Optional classical model for comparison
        """
        self.quantum_optimizer = quantum_optimizer or BleuQuantumContestOptimizer()
        self.classical_model = classical_model or BleuXGBoost()
        self.results: List[BenchmarkResult] = []

    def run_benchmark(
        self,
        features: Union[np.ndarray, pd.DataFrame],
        target: Union[np.ndarray, pd.Series],
        dataset_name: str,
        task_type: str = "classification",
        test_size: float = 0.2,
        random_state: int = 42,
    ) -> List[BenchmarkResult]:
        """Run comprehensive benchmark comparing quantum and classical approaches.

        Args:
            features: Feature matrix
            target: Target values
            dataset_name: Name of the dataset
            task_type: Type of task ("classification" or "regression")
            test_size: Proportion of data to use for testing
            random_state: Random seed for reproducibility

        Returns:
            List of benchmark results
        """
        # Split data
        features_train, features_test, target_train, target_test = train_test_split(
            features, target, test_size=test_size, random_state=random_state
        )

        # Run classical benchmark
        classical_start = time.time()
        self.classical_model.fit(features_train, target_train)
        classical_train_time = time.time() - classical_start

        classical_pred = self.classical_model.predict(features_test)
        classical_inference_time = time.time() - classical_start - classical_train_time

        # Run quantum-enhanced benchmark
        quantum_start = time.time()
        if task_type == "classification":
            # For classification, optimize attention weights
            attention_weights = self._prepare_attention_weights(features_train)
            optimized_weights, _ = self.quantum_optimizer.optimize_attention_mapping(
                attention_weights
            )
            if optimized_weights is None:
                raise ValueError("Failed to optimize attention weights")
            features_train_quantum = self._apply_quantum_weights(
                features_train, optimized_weights
            )
        else:
            # For regression, optimize feature fusion
            feature_list = self._prepare_feature_list(features_train)
            optimized_features, _ = self.quantum_optimizer.optimize_fusion_strategy(
                feature_list
            )
            if optimized_features is None:
                raise ValueError("Failed to optimize feature fusion")
            if not isinstance(optimized_features, tf.Tensor):
                raise ValueError("Optimized features must be a tensor")
            features_train_quantum = tf.keras.backend.get_value(optimized_features)

        self.classical_model.fit(features_train_quantum, target_train)
        quantum_train_time = time.time() - quantum_start

        quantum_pred = self.classical_model.predict(features_test)
        quantum_inference_time = time.time() - quantum_start - quantum_train_time

        # Calculate metrics
        if task_type == "classification":
            classical_metric = accuracy_score(target_test, classical_pred)
            quantum_metric = accuracy_score(target_test, quantum_pred)
            metric_name = "accuracy"
        else:
            classical_metric = r2_score(target_test, classical_pred)
            quantum_metric = r2_score(target_test, quantum_pred)
            metric_name = "r2_score"

        # Calculate quantum advantage
        quantum_advantage = (quantum_metric - classical_metric) / classical_metric

        # Store results
        results = [
            BenchmarkResult(
                model_name="classical",
                dataset_name=dataset_name,
                metric_name=metric_name,
                metric_value=classical_metric,
                training_time=classical_train_time,
                inference_time=classical_inference_time,
            ),
            BenchmarkResult(
                model_name="quantum_enhanced",
                dataset_name=dataset_name,
                metric_name=metric_name,
                metric_value=quantum_metric,
                training_time=quantum_train_time,
                inference_time=quantum_inference_time,
                quantum_advantage=quantum_advantage,
            ),
        ]

        self.results.extend(results)
        return results

    def _prepare_attention_weights(self, features: np.ndarray) -> tf.Tensor:
        """Prepare attention weights from input features."""
        # Convert to tensor and add batch dimension if needed
        if len(features.shape) == 2:
            features = np.expand_dims(features, axis=0)
        return tf.convert_to_tensor(features, dtype=tf.float32)

    def _prepare_feature_list(self, features: np.ndarray) -> List[tf.Tensor]:
        """Prepare feature list for quantum fusion."""
        # Split features into groups for fusion
        n_features = features.shape[1]
        split_points = [n_features // 3, 2 * n_features // 3]
        feature_groups = np.split(features, split_points, axis=1)
        return [
            tf.convert_to_tensor(group, dtype=tf.float32) for group in feature_groups
        ]

    def _apply_quantum_weights(
        self, features: np.ndarray, weights: tf.Tensor
    ) -> np.ndarray:
        """Apply quantum-optimized weights to features."""
        if weights is None:
            raise ValueError("Weights cannot be None")
        if not isinstance(weights, tf.Tensor):
            raise ValueError("Weights must be a tensor")
        weights_np = tf.keras.backend.get_value(weights)
        return features * weights_np.squeeze()

    def get_summary(self) -> pd.DataFrame:
        """Get summary of all benchmark results."""
        return pd.DataFrame([vars(r) for r in self.results])

    def save_results(self, filename: str):
        """Save benchmark results to CSV file."""
        df = self.get_summary()
        df.to_csv(filename, index=False)
        logger.info(f"Saved benchmark results to {filename}")

    def plot_results(self):
        """Plot benchmark results."""
        # Implementation for visualization would go here
