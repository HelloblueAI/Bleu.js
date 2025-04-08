"""
Quantum-Enhanced Feature Interaction Detection
Implements advanced feature interaction analysis using quantum and classical methods.
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np
from scipy.stats import spearmanr
import shap
import logging

logger = logging.getLogger(__name__)

class QuantumInteractionDetector:
    """Detects and quantifies feature interactions using quantum-enhanced methods."""
    
    def __init__(
        self,
        quantum_processor: Any,
        classical_threshold: float = 0.3,
        quantum_threshold: float = 0.2,
        shap_threshold: float = 0.1,
        weights: Optional[Dict[str, float]] = None
    ):
        """Initialize the detector with specified thresholds and weights."""
        self.quantum_processor = quantum_processor
        self.classical_threshold = classical_threshold
        self.quantum_threshold = quantum_threshold
        self.shap_threshold = shap_threshold
        
        self.weights = weights or {
            'classical': 0.3,
            'quantum': 0.4,
            'shap': 0.3
        }
        
        self.interaction_scores = {}
        self.classical_correlations = {}
        self.quantum_correlations = {}
        self.shap_interactions = {}
        
    def detect_interactions(
        self,
        features: np.ndarray,
        feature_names: List[str],
        target: Optional[np.ndarray] = None
    ) -> Dict[Tuple[str, str], float]:
        """
        Detect and score feature interactions using multiple methods.
        
        Args:
            features: Input feature matrix
            feature_names: List of feature names
            target: Optional target variable for supervised interaction detection
            
        Returns:
            Dictionary mapping feature pairs to interaction scores
        """
        self._compute_classical_correlations(features, feature_names)
        self._compute_quantum_correlations(features, feature_names)
        
        if target is not None:
            self._compute_shap_interactions(features, feature_names, target)
            
        return self._combine_interaction_scores(feature_names)
    
    def _compute_classical_correlations(
        self,
        features: np.ndarray,
        feature_names: List[str]
    ) -> None:
        """Compute classical correlation scores between features."""
        n_features = len(feature_names)
        
        for i in range(n_features):
            for j in range(i + 1, n_features):
                correlation, _ = spearmanr(features[:, i], features[:, j])
                pair = (feature_names[i], feature_names[j])
                self.classical_correlations[pair] = abs(correlation)
    
    def _compute_quantum_correlations(
        self,
        features: np.ndarray,
        feature_names: List[str]
    ) -> None:
        """Compute quantum correlation measures between features."""
        n_features = len(feature_names)
        
        for i in range(n_features):
            for j in range(i + 1, n_features):
                quantum_state = self.quantum_processor.prepare_state(
                    features[:, [i, j]]
                )
                correlation = self.quantum_processor.measure_correlation(
                    quantum_state
                )
                pair = (feature_names[i], feature_names[j])
                self.quantum_correlations[pair] = correlation
    
    def _compute_shap_interactions(
        self,
        features: np.ndarray,
        feature_names: List[str],
        target: np.ndarray
    ) -> None:
        """Compute SHAP interaction values between features."""
        explainer = shap.TreeExplainer(features)
        shap_values = explainer.shap_interaction_values(features)
        
        n_features = len(feature_names)
        for i in range(n_features):
            for j in range(i + 1, n_features):
                interaction_value = np.abs(
                    shap_values[:, i, j]
                ).mean()
                pair = (feature_names[i], feature_names[j])
                self.shap_interactions[pair] = interaction_value
    
    def _combine_interaction_scores(
        self,
        feature_names: List[str]
    ) -> Dict[Tuple[str, str], float]:
        """Combine different interaction measures into final scores."""
        combined_scores = {}
        n_features = len(feature_names)
        
        for i in range(n_features):
            for j in range(i + 1, n_features):
                pair = (feature_names[i], feature_names[j])
                
                score = (
                    self.weights['classical'] * self.classical_correlations.get(pair, 0) +
                    self.weights['quantum'] * self.quantum_correlations.get(pair, 0) +
                    self.weights['shap'] * self.shap_interactions.get(pair, 0)
                )
                
                if score > 0:
                    combined_scores[pair] = score
        
        return combined_scores
    
    def get_top_interactions(
        self,
        n: int = 10
    ) -> List[Tuple[Tuple[str, str], float]]:
        """
        Get the top N strongest feature interactions.
        
        Args:
            n: Number of top interactions to return
            
        Returns:
            List of (feature_pair, score) tuples sorted by score
        """
        sorted_interactions = sorted(
            self.interaction_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )
        return sorted_interactions[:n] 