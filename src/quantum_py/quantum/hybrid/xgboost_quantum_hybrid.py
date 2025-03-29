import numpy as np
import xgboost as xgb
from typing import Dict, List, Optional, Tuple, Union
from dataclasses import dataclass
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from ..processor import QuantumProcessor
from ..circuit import Circuit
from ...ml.train_xgboost import AdvancedModelTrainer
from ...ml.enhanced_xgboost import EnhancedXGBoost, PerformanceConfig

@dataclass
class HybridConfig:
    """Configuration for hybrid quantum-classical model"""
    # XGBoost parameters
    n_estimators: int = 1000
    learning_rate: float = 0.01
    max_depth: int = 6
    min_child_weight: int = 1
    subsample: float = 0.8
    colsample_bytree: float = 0.8
    objective: str = 'binary:logistic'
    tree_method: str = 'hist'
    
    # Quantum parameters
    n_qubits: int = 4
    n_layers: int = 2
    entanglement: str = 'linear'
    shots: int = 1000
    optimization_level: int = 3
    error_correction: bool = True
    
    # Hybrid parameters
    quantum_feature_ratio: float = 0.3  # Ratio of features to process quantum
    hybrid_optimization: bool = True
    quantum_ensemble: bool = True
    feature_selection_method: str = 'quantum'
    
    # Performance parameters
    use_gpu: bool = True
    batch_size: int = 1024
    num_workers: int = 4
    early_stopping_rounds: int = 50

class XGBoostQuantumHybrid:
    """Hybrid model combining XGBoost with quantum computing capabilities"""
    
    def __init__(
        self,
        config: Optional[HybridConfig] = None,
        quantum_processor: Optional[QuantumProcessor] = None
    ):
        self.config = config or HybridConfig()
        self.quantum_processor = quantum_processor or QuantumProcessor()
        
        # Initialize classical components
        self.xgb_trainer = AdvancedModelTrainer(
            training_config=self._get_training_config(),
            quantum_config=self._get_quantum_config(),
            security_config=None  # Add if needed
        )
        
        self.enhanced_xgb = EnhancedXGBoost(
            quantum_config=self._get_quantum_config(),
            performance_config=self._get_performance_config()
        )
        
        # Initialize quantum components
        self.quantum_circuit = Circuit()
        self.scaler = StandardScaler()
        
        # State tracking
        self.feature_importance = None
        self.quantum_features = None
        self.classical_features = None
        self.best_params = None
        self.metrics = {}
    
    def _get_training_config(self) -> Dict:
        """Convert hybrid config to training config"""
        return {
            'n_estimators': self.config.n_estimators,
            'learning_rate': self.config.learning_rate,
            'max_depth': self.config.max_depth,
            'min_child_weight': self.config.min_child_weight,
            'subsample': self.config.subsample,
            'colsample_bytree': self.config.colsample_bytree,
            'objective': self.config.objective,
            'tree_method': self.config.tree_method,
            'use_gpu': self.config.use_gpu,
            'early_stopping_rounds': self.config.early_stopping_rounds
        }
    
    def _get_quantum_config(self) -> Dict:
        """Convert hybrid config to quantum config"""
        return {
            'n_qubits': self.config.n_qubits,
            'n_layers': self.config.n_layers,
            'entanglement': self.config.entanglement,
            'shots': self.config.shots,
            'optimization_level': self.config.optimization_level,
            'error_correction': self.config.error_correction
        }
    
    def _get_performance_config(self) -> PerformanceConfig:
        """Convert hybrid config to performance config"""
        return PerformanceConfig(
            batch_size=self.config.batch_size,
            num_workers=self.config.num_workers,
            use_gpu=self.config.use_gpu
        )
    
    async def preprocess_features(
        self,
        X: np.ndarray,
        y: Optional[np.ndarray] = None
    ) -> Tuple[np.ndarray, Optional[np.ndarray]]:
        """Preprocess features using both classical and quantum methods"""
        # Scale features
        X_scaled = self.scaler.fit_transform(X) if y is not None else self.scaler.transform(X)
        
        # Split features into quantum and classical
        n_features = X.shape[1]
        n_quantum_features = int(n_features * self.config.quantum_feature_ratio)
        
        # Select most important features for quantum processing
        if self.feature_importance is not None:
            feature_ranks = np.argsort(self.feature_importance)[::-1]
            quantum_indices = feature_ranks[:n_quantum_features]
            classical_indices = feature_ranks[n_quantum_features:]
        else:
            quantum_indices = np.arange(n_quantum_features)
            classical_indices = np.arange(n_quantum_features, n_features)
        
        # Process quantum features
        X_quantum = X_scaled[:, quantum_indices]
        X_quantum_processed = await self.quantum_processor.process_features(X_quantum)
        
        # Combine quantum and classical features
        X_combined = np.hstack([
            X_quantum_processed,
            X_scaled[:, classical_indices]
        ])
        
        return X_combined, y
    
    async def train(
        self,
        X: np.ndarray,
        y: np.ndarray,
        validation_split: float = 0.2
    ) -> Dict:
        """Train the hybrid model"""
        try:
            # Split data
            X_train, X_val, y_train, y_val = train_test_split(
                X, y,
                test_size=validation_split,
                random_state=42
            )
            
            # Preprocess features
            X_train_processed, y_train = await self.preprocess_features(X_train, y_train)
            X_val_processed, y_val = await self.preprocess_features(X_val, y_val)
            
            # Train enhanced XGBoost model
            metrics = await self.enhanced_xgb.fit(
                X_train_processed,
                y_train,
                eval_set=[(X_val_processed, y_val)]
            )
            
            # Update feature importance
            self.feature_importance = self.enhanced_xgb.feature_importance
            
            # Store metrics
            self.metrics = metrics
            
            return metrics
            
        except Exception as e:
            print(f"Error during hybrid training: {str(e)}")
            raise
    
    async def predict(
        self,
        X: np.ndarray,
        return_proba: bool = False
    ) -> np.ndarray:
        """Make predictions using the hybrid model"""
        try:
            # Preprocess features
            X_processed, _ = await self.preprocess_features(X)
            
            # Get predictions
            if return_proba:
                predictions = self.enhanced_xgb.predict_proba(X_processed)
            else:
                predictions = self.enhanced_xgb.predict(X_processed)
            
            return predictions
            
        except Exception as e:
            print(f"Error during prediction: {str(e)}")
            raise
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance scores"""
        if self.feature_importance is None:
            raise ValueError("Model has not been trained yet")
        return self.feature_importance
    
    async def optimize_hyperparameters(
        self,
        X: np.ndarray,
        y: np.ndarray,
        n_trials: int = 100
    ) -> Dict:
        """Optimize hyperparameters using quantum-enhanced search"""
        try:
            # Preprocess features
            X_processed, y = await self.preprocess_features(X, y)
            
            # Optimize hyperparameters
            best_params = await self.enhanced_xgb.optimize_hyperparameters(
                X_processed,
                y,
                n_trials=n_trials
            )
            
            self.best_params = best_params
            return best_params
            
        except Exception as e:
            print(f"Error during hyperparameter optimization: {str(e)}")
            raise 