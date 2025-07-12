"""XGBoost Quantum Hybrid implementation."""

import logging
import time
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from ..circuit import QuantumCircuit
from ..processor import QuantumProcessor

logger = logging.getLogger(__name__)


@dataclass
class HybridConfig:
    """Configuration for XGBoost Quantum Hybrid"""

    n_qubits: int = 4
    n_layers: int = 2
    entanglement: str = "full"
    shots: int = 1000
    optimization_level: int = 3
    error_correction: bool = True
    use_advanced_circuits: bool = True
    max_depth: int = 6
    learning_rate: float = 0.3
    n_estimators: int = 100
    objective: str = "reg:squarederror"
    eval_metric: str = "rmse"
    quantum_feature_ratio: float = 0.3  # Ratio of features to process quantum
    use_error_mitigation: bool = True
    use_quantum_memory: bool = True
    use_adaptive_entanglement: bool = True
    quantum_feature_selection: bool = True
    batch_size: int = 32
    early_stopping_rounds: int = 10
    use_gpu: bool = False


class XGBoostQuantumHybrid:
    """Hybrid model combining XGBoost with quantum computing capabilities"""

    def __init__(
        self,
        config: Optional[Union[Dict, HybridConfig]] = None,
        quantum_processor: Optional[QuantumProcessor] = None,
    ):
        # Convert dict config to HybridConfig instance
        if isinstance(config, dict):
            self.config = HybridConfig(**config)
        else:
            self.config = config or HybridConfig()

        self.quantum_processor = quantum_processor or QuantumProcessor(
            n_qubits=self.config.n_qubits,
            n_layers=self.config.n_layers,
            entanglement=self.config.entanglement,
            shots=self.config.shots,
            optimization_level=self.config.optimization_level,
            error_correction=self.config.error_correction,
            use_advanced_circuits=self.config.use_advanced_circuits,
        )

        # Initialize quantum components
        self.quantum_circuit = QuantumCircuit(
            n_qubits=self.config.n_qubits,
            n_layers=self.config.n_layers,
            entanglement=self.config.entanglement,
            use_advanced_circuits=self.config.use_advanced_circuits,
            use_error_mitigation=self.config.use_error_mitigation,
            use_quantum_memory=self.config.use_quantum_memory,
            use_adaptive_entanglement=self.config.use_adaptive_entanglement,
        )

        # Initialize XGBoost parameters
        self.xgb_params = {
            "max_depth": self.config.max_depth,
            "learning_rate": self.config.learning_rate,
            "n_estimators": self.config.n_estimators,
            "objective": self.config.objective,
            "eval_metric": self.config.eval_metric,
            "tree_method": "hist",
            "n_jobs": -1,
            "early_stopping_rounds": self.config.early_stopping_rounds,
            "use_gpu": self.config.use_gpu,
        }

        # Initialize data preprocessing
        self.scaler = StandardScaler()

        # State tracking
        self.feature_importance = None
        self.quantum_features = None
        self.classical_features = None
        self.model = None
        self.metrics = {}
        self.training_history = []

        # Initialize logging
        self._setup_logging()

    def _setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        )
        self.logger = logging.getLogger(__name__)

    async def preprocess_features(
        self, features: np.ndarray, labels: Optional[np.ndarray] = None
    ) -> Tuple[np.ndarray, Optional[np.ndarray]]:
        """Preprocess features using both classical and quantum methods"""
        try:
            # Scale features
            features_scaled = (
                self.scaler.fit_transform(features)
                if labels is not None
                else self.scaler.transform(features)
            )

            # Split features into quantum and classical
            n_features = features.shape[1]
            n_quantum_features = int(n_features * self.config.quantum_feature_ratio)

            # Select most important features for quantum processing
            if self.feature_importance is not None:
                feature_ranks = np.argsort(self.feature_importance)[::-1]
                quantum_indices = feature_ranks[:n_quantum_features]
            else:
                quantum_indices = np.arange(n_quantum_features)

            # Process quantum features
            features_quantum = features_scaled[:, quantum_indices]
            features_quantum_processed = await self.quantum_processor.process_features(
                features_quantum
            )

            if features_quantum_processed is None:
                self.logger.warning(
                    "Quantum processing failed, using original features"
                )
                return features_scaled, labels

            # Reshape quantum features to match original dimensions
            features_quantum_processed = features_quantum_processed.reshape(
                features.shape[0], -1
            )

            # Create enhanced features
            features_enhanced = np.hstack(
                [
                    features_scaled,  # Keep all original features
                    features_quantum_processed,  # Add quantum-processed features
                ]
            )

            # Log feature processing metrics
            self.logger.info("Feature processing metrics:")
            self.logger.info(f"- Original features: {n_features}")
            self.logger.info(f"- Quantum features: {n_quantum_features}")
            self.logger.info(f"- Enhanced features: {features_enhanced.shape[1]}")

            return features_enhanced, labels

        except Exception as e:
            self.logger.error(f"Error in feature preprocessing: {str(e)}")
            raise

    async def train(
        self, features: np.ndarray, labels: np.ndarray, validation_split: float = 0.2
    ) -> Dict:
        """Train the hybrid model"""
        try:
            start_time = time.time()
            self.logger.info("Starting hybrid model training...")

            # Split data
            features_train, features_val, labels_train, labels_val = train_test_split(
                features, labels, test_size=validation_split, random_state=42
            )

            # Preprocess features
            self.logger.info("Preprocessing features...")
            features_train_enhanced, labels_train = await self.preprocess_features(
                features_train, labels_train
            )
            features_val_enhanced, labels_val = await self.preprocess_features(
                features_val, labels_val
            )

            # Create DMatrix for XGBoost
            dtrain = xgb.DMatrix(features_train_enhanced, label=labels_train)
            dval = xgb.DMatrix(features_val_enhanced, label=labels_val)

            # Train model
            self.logger.info("Training XGBoost model...")
            self.model = xgb.train(
                self.xgb_params,
                dtrain,
                evals=[(dtrain, "train"), (dval, "val")],
                verbose_eval=False,
                callbacks=[
                    xgb.callback.TrainingCallback(
                        lambda env: self._on_training_iteration(env)
                    )
                ],
            )

            # Update feature importance
            self.feature_importance = self.model.get_score(importance_type="gain")

            # Store metrics
            self.metrics = {
                "train": dict(self.model.eval(dtrain)),
                "val": dict(self.model.eval(dval)),
                "training_time": time.time() - start_time,
                "quantum_metrics": self.quantum_circuit.get_circuit_info()["metrics"],
            }

            self.logger.info("Training completed successfully")
            self.logger.info(f"Training metrics: {self.metrics}")

            return self.metrics

        except ValueError as e:
            self.logger.error(f"Invalid input data: {str(e)}")
            raise
        except RuntimeError as e:
            self.logger.error(f"Error during model training: {str(e)}")
            raise
        except ImportError as e:
            self.logger.error(f"Failed to import required dependencies: {str(e)}")
            raise

    def _on_training_iteration(self, env):
        """Callback for training iterations"""
        iteration = env.iteration
        evaluation_result_list = env.evaluation_result_list

        # Store iteration metrics
        self.training_history.append(
            {"iteration": iteration, "metrics": dict(evaluation_result_list)}
        )

        # Log progress
        if iteration % 10 == 0:
            self.logger.info(f"Iteration {iteration}: {dict(evaluation_result_list)}")

    async def predict(
        self, features: np.ndarray, return_proba: bool = False
    ) -> np.ndarray:
        """Make predictions using the hybrid model"""
        try:
            if self.model is None:
                raise ValueError("Model has not been trained yet")

            # Preprocess features
            features_enhanced, _ = await self.preprocess_features(features)

            # Create DMatrix
            dtest = xgb.DMatrix(features_enhanced)

            # Get predictions
            predictions = self.model.predict(dtest)

            if not return_proba:
                predictions = np.round(predictions)

            return predictions

        except ValueError as e:
            self.logger.error(f"Invalid input data: {str(e)}")
            raise
        except RuntimeError as e:
            self.logger.error(f"Error during prediction: {str(e)}")
            raise

    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance scores"""
        return self.feature_importance or {}

    def get_training_history(self) -> List[Dict]:
        """Get training history"""
        return self.training_history

    def get_quantum_metrics(self) -> Dict[str, Any]:
        """Get quantum circuit metrics"""
        return self.quantum_circuit.get_circuit_info()["metrics"]
