"""
Explainability Engine Implementation
Provides advanced model explainability and interpretability capabilities.
"""

import logging
import numpy as np
from typing import Dict, List, Optional, Tuple, Union, Any
import shap
import lime
import lime.lime_tabular
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd

logger = logging.getLogger(__name__)

class ExplainabilityEngine:
    def __init__(
        self,
        method: str = 'shap',
        n_samples: int = 1000,
        feature_names: Optional[List[str]] = None
    ):
        self.method = method
        self.n_samples = n_samples
        self.feature_names = feature_names
        self.explainer = None
        self.scaler = StandardScaler()
        self.initialized = False

    async def initialize(self):
        """Initialize the explainability engine."""
        try:
            self.initialized = True
            logging.info("✅ Explainability engine initialized successfully")
        except Exception as e:
            logging.error(f"❌ Failed to initialize explainability engine: {str(e)}")
            raise

    async def generate_explanation(self, features: np.ndarray) -> Dict[str, Any]:
        """Generate explanation for model predictions."""
        try:
            if self.method is None:
                logger.error("Explanation method not initialized")
                return {}
                
            # Scale features
            if self.scaler is None:
                logger.error("Scaler not initialized")
                return {}
                
            features_scaled = self.scaler.fit_transform(features)
            
            # Generate explanation
            explanation = await self._generate_shap_explanation(features_scaled)
            
            return explanation
        except Exception as e:
            logger.error(f"Explanation generation error: {e}")
            return {}

    async def analyze_feature_importance(self, features: np.ndarray) -> Dict[str, float]:
        """Analyze feature importance scores."""
        try:
            if self.explainer is None:
                logger.error("Explainer not initialized")
                return {}
                
            # Calculate feature importance
            shap_values = self.explainer.shap_values(features)
            if shap_values is None:
                logger.error("Failed to calculate SHAP values")
                return {}
                
            importance = np.abs(shap_values).mean(axis=0)
            
            # Create feature importance dictionary
            feature_importance = {
                f"feature_{i}": float(score) 
                for i, score in enumerate(importance)
            }
            
            return feature_importance
        except Exception as e:
            logger.error(f"Feature importance analysis error: {e}")
            return {}

    async def explain_prediction(self, features: np.ndarray) -> Dict[str, Any]:
        """Generate detailed explanation for a single prediction."""
        try:
            if self.explainer is None:
                logger.error("Explainer not initialized")
                return {}
                
            if not isinstance(self.explainer, (shap.TreeExplainer, shap.KernelExplainer)):
                logger.error("Invalid explainer type")
                return {}
                
            # Get prediction
            shap_values = self.explainer.shap_values(features)
            if shap_values is None:
                logger.error("Failed to calculate SHAP values")
                return {}
                
            # Get feature importance
            importance = await self.analyze_feature_importance(features)
            
            # Generate explanation
            explanation = await self.generate_explanation(features)
            
            return {
                'prediction': shap_values.tolist(),
                'feature_importance': importance,
                'explanation': explanation
            }
        except Exception as e:
            logger.error(f"Prediction explanation error: {e}")
            return {}

    async def _generate_shap_explanation(
        self,
        X: np.ndarray,
        instance: Optional[np.ndarray] = None
    ) -> Dict:
        """Generate SHAP-based explanations."""
        try:
            # Create SHAP explainer
            if isinstance(self.explainer, (shap.TreeExplainer, shap.KernelExplainer)):
                pass
            else:
                self.explainer = shap.TreeExplainer(self.explainer)

            # Calculate SHAP values
            if self.explainer is None:
                raise ValueError("SHAP explainer not initialized")

            if self.scaler is None:
                raise ValueError("Scaler not initialized")
                
            if instance is not None:
                # For single instance
                instance_scaled = self.scaler.transform(instance.reshape(1, -1))
                shap_values = self.explainer.shap_values(instance_scaled)
                if isinstance(shap_values, list):
                    shap_values = shap_values[0]
            else:
                # For dataset
                shap_values = self.explainer.shap_values(X)
                if isinstance(shap_values, list):
                    shap_values = shap_values[0]

            # Calculate feature importance
            feature_importance = np.abs(shap_values).mean(axis=0)

            # Create explanation dictionary
            explanation = {
                'shap_values': shap_values,
                'feature_importance': feature_importance,
                'feature_names': self.feature_names or [f"Feature {i}" for i in range(X.shape[1])]
            }

            return explanation

        except Exception as e:
            logger.error(f"❌ SHAP explanation generation failed: {str(e)}")
            raise

    async def _generate_lime_explanation(
        self,
        X: np.ndarray,
        instance: Optional[np.ndarray] = None
    ) -> Dict:
        """Generate LIME-based explanations."""
        try:
            if self.scaler is None:
                raise ValueError("Scaler not initialized")

            # Create feature names if not provided
            if self.feature_names is None:
                self.feature_names = [f"Feature {i}" for i in range(X.shape[1])]

            # Create LIME explainer
            self.explainer = lime.lime_tabular.LimeTabularExplainer(
                X,
                feature_names=self.feature_names,
                class_names=['Negative', 'Positive'],
                mode='classification'
            )

            # Generate explanation
            if instance is not None:
                # For single instance
                instance_scaled = self.scaler.transform(instance.reshape(1, -1))
                exp = self.explainer.explain_instance(
                    instance_scaled[0],
                    self.explainer.predict_proba
                )
            else:
                # For dataset
                exp = self.explainer.explain_instance(
                    X[0],
                    self.explainer.predict_proba
                )

            # Extract feature importance
            feature_importance = np.array([
                exp.as_list()[i][1]
                for i in range(len(exp.as_list()))
            ])

            # Create explanation dictionary
            explanation = {
                'lime_explanation': exp,
                'feature_importance': feature_importance,
                'feature_names': self.feature_names
            }

            return explanation

        except Exception as e:
            logger.error(f"❌ LIME explanation generation failed: {str(e)}")
            raise

    async def _create_explanation_plot(
        self,
        explanation: Dict
    ) -> None:
        """Create visualization of the explanation."""
        try:
            if self.method is None:
                raise ValueError("Explanation method not initialized")

            if self.method == 'shap':
                # Create SHAP summary plot
                plt.figure(figsize=(10, 6))
                shap.summary_plot(
                    explanation['shap_values'],
                    features=explanation['feature_names'],
                    show=False
                )
                plt.title('SHAP Feature Importance')
                plt.tight_layout()
                plt.savefig('shap_summary.png')
                plt.close()

                # Create SHAP bar plot
                plt.figure(figsize=(10, 6))
                shap.summary_plot(
                    explanation['shap_values'],
                    features=explanation['feature_names'],
                    plot_type='bar',
                    show=False
                )
                plt.title('SHAP Feature Importance (Bar)')
                plt.tight_layout()
                plt.savefig('shap_bar.png')
                plt.close()

            elif self.method == 'lime':
                # Create LIME plot
                plt.figure(figsize=(10, 6))
                explanation['lime_explanation'].as_pyplot_figure()
                plt.title('LIME Feature Importance')
                plt.tight_layout()
                plt.savefig('lime_explanation.png')
                plt.close()

            logger.info("✅ Explanation plots saved successfully")

        except Exception as e:
            logger.error(f"❌ Failed to create explanation plots: {str(e)}")
            raise

    async def dispose(self):
        """Clean up resources."""
        try:
            self.explainer = None
            self.scaler = None
            self.method = None
            self.feature_names = None
            self.initialized = False
            logger.info("✅ Explainability engine resources cleaned up")
        except Exception as e:
            logger.error(f"❌ Failed to clean up explainability engine: {str(e)}")
            raise 