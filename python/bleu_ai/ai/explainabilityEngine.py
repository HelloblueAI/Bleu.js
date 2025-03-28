"""
Explainability Engine Implementation
Provides advanced model explainability and interpretability capabilities.
"""

import logging
import numpy as np
from typing import Dict, List, Optional, Tuple, Union
import shap
import lime
import lime.lime_tabular
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd

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

    async def generateExplanation(
        self,
        model: any,
        X: np.ndarray,
        instance: Optional[np.ndarray] = None
    ) -> Dict:
        """Generate model explanations."""
        try:
            if not self.initialized:
                await self.initialize()

            # Scale features
            X_scaled = self.scaler.fit_transform(X)

            # Generate explanations based on method
            if self.method == 'shap':
                explanation = await self._generate_shap_explanation(model, X_scaled, instance)
            elif self.method == 'lime':
                explanation = await self._generate_lime_explanation(model, X_scaled, instance)
            else:
                raise ValueError(f"Unsupported explanation method: {self.method}")

            # Create visualization
            await self._create_explanation_plot(explanation)

            return explanation

        except Exception as e:
            logging.error(f"❌ Explanation generation failed: {str(e)}")
            raise

    async def _generate_shap_explanation(
        self,
        model: any,
        X: np.ndarray,
        instance: Optional[np.ndarray] = None
    ) -> Dict:
        """Generate SHAP-based explanations."""
        try:
            # Create SHAP explainer
            if isinstance(model, (shap.TreeExplainer, shap.KernelExplainer)):
                self.explainer = model
            else:
                self.explainer = shap.TreeExplainer(model)

            # Calculate SHAP values
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
            logging.error(f"❌ SHAP explanation generation failed: {str(e)}")
            raise

    async def _generate_lime_explanation(
        self,
        model: any,
        X: np.ndarray,
        instance: Optional[np.ndarray] = None
    ) -> Dict:
        """Generate LIME-based explanations."""
        try:
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
                    model.predict_proba
                )
            else:
                # For dataset
                exp = self.explainer.explain_instance(
                    X[0],
                    model.predict_proba
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
            logging.error(f"❌ LIME explanation generation failed: {str(e)}")
            raise

    async def _create_explanation_plot(
        self,
        explanation: Dict
    ) -> None:
        """Create visualization of the explanation."""
        try:
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

            logging.info("✅ Explanation plots saved successfully")

        except Exception as e:
            logging.error(f"❌ Failed to create explanation plots: {str(e)}")
            raise

    async def explain(
        self,
        predictions: np.ndarray,
        X: np.ndarray,
        instance: Optional[np.ndarray] = None
    ) -> Dict:
        """Generate explanations for predictions."""
        try:
            # Create a simple model for explanation
            from sklearn.ensemble import RandomForestClassifier
            model = RandomForestClassifier(n_estimators=100)
            model.fit(X, predictions)

            # Generate explanations
            explanation = await self.generateExplanation(model, X, instance)

            # Add prediction information
            explanation['predictions'] = predictions
            if instance is not None:
                explanation['instance_prediction'] = model.predict(instance.reshape(1, -1))[0]

            return explanation

        except Exception as e:
            logging.error(f"❌ Prediction explanation failed: {str(e)}")
            raise

    async def dispose(self):
        """Clean up resources."""
        try:
            self.explainer = None
            self.scaler = None
            self.initialized = False
            logging.info("✅ Explainability engine resources cleaned up")
        except Exception as e:
            logging.error(f"❌ Failed to clean up explainability engine: {str(e)}")
            raise 