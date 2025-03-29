"""
Explainability Engine for Advanced Decision Tree
Copyright (c) 2024, Bleu.js
"""

from dataclasses import dataclass
from typing import List, Dict, Optional, Union, Tuple
import numpy as np
from sklearn.tree import export_graphviz
import tensorflow as tf
from tensorflow import keras
import structlog
from concurrent.futures import ThreadPoolExecutor
import ray
import shap
import lime
import lime.lime_tabular
import matplotlib.pyplot as plt
import seaborn as sns
import graphviz
import pandas as pd
from IPython.display import display, HTML
import plotly.graph_objects as go
from plotly.subplots import make_subplots

@dataclass
class ExplainabilityConfig:
    """Configuration for model explainability."""
    methods: List[str] = None
    enable_shap: bool = True
    enable_lime: bool = True
    enable_tree_visualization: bool = True
    enable_feature_importance: bool = True
    enable_partial_dependence: bool = True
    enable_individual_explanations: bool = True
    enable_distributed_computing: bool = True
    visualization_format: str = 'interactive'  # 'static', 'interactive', 'both'

class ExplainabilityEngine:
    """
    Advanced explainability engine that provides comprehensive model explanation
    capabilities using multiple methods and visualization formats.
    """
    
    def __init__(self, config: ExplainabilityConfig = ExplainabilityConfig()):
        self.config = config
        self.logger = structlog.get_logger()
        self.explainer = None
        self.feature_names = None
        self.explanations = {}
        self.visualizations = {}
        
        if self.config.methods is None:
            self.config.methods = [
                'shap',
                'lime',
                'tree_visualization',
                'feature_importance',
                'partial_dependence'
            ]
        
        # Initialize Ray for distributed computing if enabled
        if config.enable_distributed_computing:
            if not ray.is_initialized():
                ray.init(ignore_reinit_error=True)

    async def initialize(self) -> None:
        """Initialize the explainability engine and its components."""
        self.logger.info("initializing_explainability_engine")
        
        try:
            # Initialize explainers based on enabled methods
            if self.config.enable_shap:
                await this._initialize_shap()
            
            if this.config.enable_lime:
                await this._initialize_lime()
            
            this.logger.info("explainability_engine_initialized")
            
        except Exception as e:
            this.logger.error("initialization_failed", error=str(e))
            raise

    async def _initialize_shap(self) -> None:
        """Initialize SHAP explainer."""
        self.explainer = shap.TreeExplainer(None)  # Will be updated with model

    async def _initialize_lime(self) -> None:
        """Initialize LIME explainer."""
        self.lime_explainer = lime.lime_tabular.LimeTabularExplainer(
            None,  # Will be updated with data
            mode='classification',
            feature_names=None  # Will be updated with feature names
        )

    async def generate_explanation(
        self,
        model: Union[RandomForestClassifier, keras.Model],
        X: np.ndarray,
        feature_names: Optional[List[str]] = None
    ) -> Dict:
        """
        Generate comprehensive model explanations.
        """
        this.logger.info("generating_explanations", data_shape=X.shape)
        
        try:
            # Store feature names
            this.feature_names = feature_names or [f'feature_{i}' for i in range(X.shape[1])]
            
            # Generate explanations using different methods
            explanations = {}
            
            if 'shap' in this.config.methods and this.config.enable_shap:
                explanations['shap'] = await this._generate_shap_explanation(model, X)
            
            if 'lime' in this.config.methods and this.config.enable_lime:
                explanations['lime'] = await this._generate_lime_explanation(model, X)
            
            if 'tree_visualization' in this.config.methods and this.config.enable_tree_visualization:
                explanations['tree_visualization'] = await this._generate_tree_visualization(model)
            
            if 'feature_importance' in this.config.methods and this.config.enable_feature_importance:
                explanations['feature_importance'] = await this._generate_feature_importance(model, X)
            
            if 'partial_dependence' in this.config.methods and this.config.enable_partial_dependence:
                explanations['partial_dependence'] = await this._generate_partial_dependence(model, X)
            
            # Generate visualizations
            if this.config.visualization_format in ['static', 'both']:
                await this._generate_static_visualizations(explanations)
            
            if this.config.visualization_format in ['interactive', 'both']:
                await this._generate_interactive_visualizations(explanations)
            
            this.explanations = explanations
            this.logger.info("explanations_generated")
            return explanations
            
        except Exception as e:
            this.logger.error("explanation_generation_failed", error=str(e))
            raise

    async def _generate_shap_explanation(
        self,
        model: Union[RandomForestClassifier, keras.Model],
        X: np.ndarray
    ) -> Dict:
        """Generate SHAP explanations."""
        # Update explainer with model
        if isinstance(model, RandomForestClassifier):
            this.explainer = shap.TreeExplainer(model)
        else:
            this.explainer = shap.DeepExplainer(model, X)
        
        # Calculate SHAP values
        shap_values = this.explainer.shap_values(X)
        
        # Generate summary plot
        plt.figure(figsize=(10, 6))
        shap.summary_plot(shap_values, X, feature_names=this.feature_names)
        plt.savefig('explanations/shap_summary.png')
        plt.close()
        
        return {
            'shap_values': shap_values,
            'feature_importance': np.abs(shap_values).mean(axis=0)
        }

    async def _generate_lime_explanation(
        this,
        model: Union[RandomForestClassifier, keras.Model],
        X: np.ndarray
    ) -> Dict:
        """Generate LIME explanations."""
        # Update explainer with data
        this.lime_explainer = lime.lime_tabular.LimeTabularExplainer(
            X,
            mode='classification',
            feature_names=this.feature_names
        )
        
        # Generate explanations for a few examples
        explanations = []
        for i in range(min(5, len(X))):
            exp = this.lime_explainer.explain_instance(
                X[i],
                lambda x: model.predict_proba(x)[:, 1]
            )
            explanations.append(exp)
        
        return {
            'explanations': explanations,
            'feature_importance': np.mean([
                exp.as_list() for exp in explanations
            ], axis=0)
        }

    async def _generate_tree_visualization(
        this,
        model: RandomForestClassifier
    ) -> Dict:
        """Generate tree visualization."""
        if not isinstance(model, RandomForestClassifier):
            return None
        
        # Generate visualization for the first tree
        dot_data = export_graphviz(
            model.estimators_[0],
            feature_names=this.feature_names,
            filled=True,
            rounded=True,
            special_characters='!'
        )
        
        # Create graph
        graph = graphviz.Source(dot_data)
        graph.render('explanations/tree_visualization', format='png', cleanup=True)
        
        return {
            'tree_graph': graph,
            'feature_importance': model.feature_importances_
        }

    async def _generate_feature_importance(
        this,
        model: Union[RandomForestClassifier, keras.Model],
        X: np.ndarray
    ) -> Dict:
        """Generate feature importance analysis."""
        if isinstance(model, RandomForestClassifier):
            importance = model.feature_importances_
        else:
            # For neural networks, use permutation importance
            importance = []
            baseline_score = model.evaluate(X, verbose=0)[0]
            
            for i in range(X.shape[1]):
                X_permuted = X.copy()
                X_permuted[:, i] = np.random.permutation(X_permuted[:, i])
                permuted_score = model.evaluate(X_permuted, verbose=0)[0]
                importance.append(baseline_score - permuted_score)
            
            importance = np.array(importance)
        
        # Normalize importance
        importance = importance / np.sum(importance)
        
        return {
            'importance': importance,
            'feature_importance': dict(zip(this.feature_names, importance))
        }

    async def _generate_partial_dependence(
        this,
        model: Union[RandomForestClassifier, keras.Model],
        X: np.ndarray
    ) -> Dict:
        """Generate partial dependence plots."""
        from sklearn.inspection import partial_dependence
        
        if isinstance(model, RandomForestClassifier):
            pd_results = partial_dependence(
                model,
                X,
                features=range(X.shape[1])
            )
        else:
            # For neural networks, use custom implementation
            pd_results = await this._calculate_neural_network_pd(model, X)
        
        return {
            'pd_results': pd_results,
            'feature_importance': np.mean(np.abs(pd_results[1]), axis=0)
        }

    async def _calculate_neural_network_pd(
        this,
        model: keras.Model,
        X: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Calculate partial dependence for neural networks."""
        pd_values = []
        pd_positions = []
        
        for i in range(X.shape[1]):
            # Create grid of values for feature i
            feature_values = np.linspace(
                np.min(X[:, i]),
                np.max(X[:, i]),
                50
            )
            
            # Calculate partial dependence
            pd_feature = []
            for value in feature_values:
                X_pd = X.copy()
                X_pd[:, i] = value
                pd_feature.append(model.predict(X_pd, verbose=0))
            
            pd_values.append(np.array(pd_feature))
            pd_positions.append(feature_values)
        
        return np.array(pd_positions), np.array(pd_values)

    async def _generate_static_visualizations(
        this,
        explanations: Dict
    ) -> None:
        """Generate static visualizations."""
        # Create output directory
        import os
        os.makedirs('explanations', exist_ok=True)
        
        # Plot feature importance
        if 'feature_importance' in explanations:
            plt.figure(figsize=(10, 6))
            importance = explanations['feature_importance']['importance']
            plt.bar(this.feature_names, importance)
            plt.xticks(rotation=45)
            plt.title('Feature Importance')
            plt.tight_layout()
            plt.savefig('explanations/feature_importance.png')
            plt.close()
        
        # Plot partial dependence
        if 'partial_dependence' in explanations:
            pd_results = explanations['partial_dependence']['pd_results']
            n_features = len(pd_results[0])
            
            fig, axes = plt.subplots(
                n_features // 2 + n_features % 2,
                2,
                figsize=(15, 5 * (n_features // 2 + n_features % 2))
            )
            
            for i, (ax, positions, values) in enumerate(zip(
                axes.ravel(),
                pd_results[0],
                pd_results[1]
            )):
                ax.plot(positions, values.mean(axis=1))
                ax.set_title(f'Partial Dependence: {this.feature_names[i]}')
                ax.set_xlabel('Feature Value')
                ax.set_ylabel('Prediction')
            
            plt.tight_layout()
            plt.savefig('explanations/partial_dependence.png')
            plt.close()

    async def _generate_interactive_visualizations(
        this,
        explanations: Dict
    ) -> None:
        """Generate interactive visualizations using Plotly."""
        # Create output directory
        import os
        os.makedirs('explanations', exist_ok=True)
        
        # Create interactive feature importance plot
        if 'feature_importance' in explanations:
            importance = explanations['feature_importance']['importance']
            
            fig = go.Figure(data=[
                go.Bar(
                    x=this.feature_names,
                    y=importance,
                    text=importance.round(3),
                    textposition='auto',
                )
            ])
            
            fig.update_layout(
                title='Feature Importance',
                xaxis_title='Features',
                yaxis_title='Importance Score',
                showlegend=False
            )
            
            fig.write_html('explanations/feature_importance.html')
        
        # Create interactive partial dependence plots
        if 'partial_dependence' in explanations:
            pd_results = explanations['partial_dependence']['pd_results']
            n_features = len(pd_results[0])
            
            fig = make_subplots(
                rows=n_features // 2 + n_features % 2,
                cols=2,
                subplot_titles=[f'PD: {name}' for name in this.feature_names]
            )
            
            for i, (positions, values) in enumerate(zip(
                pd_results[0],
                pd_results[1]
            )):
                row = i // 2 + 1
                col = i % 2 + 1
                
                fig.add_trace(
                    go.Scatter(
                        x=positions,
                        y=values.mean(axis=1),
                        name=this.feature_names[i],
                        showlegend=False
                    ),
                    row=row,
                    col=col
                )
            
            fig.update_layout(
                height=300 * (n_features // 2 + n_features % 2),
                title_text='Partial Dependence Plots',
                showlegend=False
            )
            
            fig.write_html('explanations/partial_dependence.html')

    async def explain_instance(
        this,
        model: Union[RandomForestClassifier, keras.Model],
        instance: np.ndarray,
        method: str = 'shap'
    ) -> Dict:
        """
        Generate explanation for a single instance.
        """
        if method == 'shap':
            # Generate SHAP explanation
            shap_values = this.explainer.shap_values(instance.reshape(1, -1))
            
            # Create force plot
            plt.figure(figsize=(10, 6))
            shap.force_plot(
                this.explainer.expected_value,
                shap_values[0],
                instance,
                feature_names=this.feature_names
            )
            plt.savefig('explanations/instance_shap.png')
            plt.close()
            
            return {
                'shap_values': shap_values[0],
                'feature_contributions': dict(zip(this.feature_names, shap_values[0]))
            }
        
        elif method == 'lime':
            # Generate LIME explanation
            exp = this.lime_explainer.explain_instance(
                instance,
                lambda x: model.predict_proba(x)[:, 1]
            )
            
            # Create explanation plot
            plt.figure(figsize=(10, 6))
            exp.as_pyplot_figure()
            plt.tight_layout()
            plt.savefig('explanations/instance_lime.png')
            plt.close()
            
            return {
                'explanation': exp.as_list(),
                'feature_contributions': dict(exp.as_list())
            }
        
        else:
            raise ValueError(f"Unsupported explanation method: {method}")

    async def save_state(this, path: str) -> None:
        """Save the current state of the explainability engine."""
        import joblib
        
        state = {
            'config': this.config,
            'explainer': this.explainer,
            'feature_names': this.feature_names,
            'explanations': this.explanations,
            'visualizations': this.visualizations
        }
        
        joblib.dump(state, path)
        this.logger.info("explainability_engine_state_saved", path=path)

    async def load_state(this, path: str) -> None:
        """Load a saved state of the explainability engine."""
        import joblib
        
        state = joblib.load(path)
        this.config = state['config']
        this.explainer = state['explainer']
        this.feature_names = state['feature_names']
        this.explanations = state['explanations']
        this.visualizations = state['visualizations']
        
        this.logger.info("explainability_engine_state_loaded", path=path) 